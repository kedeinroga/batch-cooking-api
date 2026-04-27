# CLAUDE.md — Batch Cooking API

Documento de contexto para desarrollo asistido por IA. Cubre arquitectura, patrones, estándares y estado actual del proyecto.

---

## 1. Qué es el proyecto

API backend para un servicio de "Batch Cooking": los clientes programan almuerzos y cenas para toda la semana laboral (Lunes–Viernes). El staff prepara todo una vez y lo entrega. **Solo backend** — el frontend (Next.js) vive en un repositorio separado.

---

## 2. Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | NestJS + TypeScript | |
| ORM | Prisma | |
| Base de datos | Supabase (PostgreSQL) | Velocidad de MVP + capa gratuita. Auth delegada a Supabase. La arquitectura limpia permite migrar el proveedor sin reescribir lógica de negocio. |
| Auth | Supabase Auth (email/password) | |
| Storage | Google Cloud Storage | Vouchers de pago |
| Deploy | Docker multi-stage Alpine → Cloud Run | `min-instances: 0` → cold starts posibles |
| Secretos | Google Secret Manager (`PLATFORM_CONFIG`) | |

---

## 3. Arquitectura — Clean Architecture Hexagonal

### 3.1. Reglas de dependencia (estrictas, no negociables)

```
libs/core/         → nunca importa de infrastructure/ ni de src/
libs/infrastructure/ → implementa contratos de core/domain-services/
src/modules/       → única capa que conoce NestJS; conecta todo vía DI
libs/shared/       → puede ser importado por cualquier capa
```

### 3.2. Mapa de carpetas

```
libs/
├── core/
│   ├── domain/
│   │   ├── entities/          → Clases TypeScript puras (sin decoradores)
│   │   ├── enums/             → OrderStatus, UserRole, MealType, DishType
│   │   └── exceptions/        → DomainException base + excepciones concretas
│   ├── domain-services/
│   │   ├── repositories/      → Abstract classes (tokens de DI para NestJS)
│   │   └── services/          → StorageService abstract
│   └── use-cases/             → Lógica de negocio; 1 clase = 1 responsabilidad
│       ├── orders/
│       ├── payments/
│       ├── catalog/
│       ├── operations/
│       ├── admin/
│       ├── profile/
│       └── delivery/
├── infrastructure/
│   └── services/
│       ├── custom/            → PrismaService, GcpStorageService, ConfigService (+ módulos NestJS)
│       └── implementations/
│           ├── mappers/       → Prisma model ↔ domain entity (solo método estático toDomain)
│           └── prisma-*.repository.ts
└── shared/
    ├── week-identifier.utils.ts  → ISO week parsing, currentWeekIdentifier(), isOrderWindowOpen()
    ├── lima-time.utils.ts         → nowInLima(), conversiones UTC ↔ America/Lima
    ├── discount.utils.ts          → cálculo de descuentos
    └── ticket-number.utils.ts     → genera TK-2026W16-0001

src/
├── modules/
│   ├── auth/                  → SupabaseJwtGuard, RolesGuard, @Roles() decorator
│   ├── orders/
│   ├── payments/
│   ├── catalog/
│   ├── operations/
│   ├── admin/
│   ├── profile/
│   └── delivery-addresses/
└── shared/
    ├── constants/domain-exceptions-http.map.ts
    ├── filters/generic-exception.filter.ts
    ├── interfaces/request.interface.ts   → ICustomRequest (extiende Express Request)
    └── middleware/logger.middleware.ts   → asigna globalTraceId (UUID) a cada request
```

### 3.3. Path aliases (tsconfig.json)

```
@batch-cooking/domain          → libs/core/domain/index.ts
@batch-cooking/domain-services → libs/core/domain-services/index.ts
@batch-cooking/use-cases       → libs/core/use-cases/index.ts
@batch-cooking/infrastructure  → libs/infrastructure/index.ts
@batch-cooking/shared          → libs/shared/index.ts
```

Cada `index.ts` re-exporta todo lo de su capa. Al agregar algo nuevo, siempre actualizar el `index.ts` correspondiente.

---

## 4. Patrón de inyección de dependencias — EL MÁS IMPORTANTE

NestJS resuelve DI en runtime usando tokens de clase. Las interfaces TypeScript se borran al compilar → **usar `abstract class` como tokens, nunca interfaces**.

Los repositorios en `infrastructure/` **no tienen `@Injectable()`**. Todo el wiring ocurre en `src/modules/<feature>/<feature>.module.ts` via `useFactory`.

```typescript
// src/modules/orders/orders.module.ts
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    Reflector,
    SupabaseJwtGuard,
    // Repositorios: abstract class como token → implementación concreta en factory
    {
      provide: OrderRepository,
      useFactory: (p: PrismaService) => new PrismaOrderRepository(p),
      inject: [PrismaService],
    },
    // Guards: siempre en cada módulo
    {
      provide: RolesGuard,
      useFactory: (r: Reflector, u: UserProfileRepository) => new RolesGuard(r, u),
      inject: [Reflector, UserProfileRepository],
    },
    // Use cases: reciben abstract classes, nunca implementaciones concretas
    {
      provide: CreateOrderUseCase,
      useFactory: (o: OrderRepository, w: WeeklyConfigRepository) => new CreateOrderUseCase(o, w),
      inject: [OrderRepository, WeeklyConfigRepository],
    },
  ],
  controllers: [OrdersController],
})
export class OrdersModule {}
```

**Módulos de infraestructura disponibles para importar:**
- `ConfigModule` → provee `ConfigService`
- `PrismaModule` → provee `PrismaService`
- `GcpStorageModule` → provee `GcpStorageService` (solo si el módulo usa GCS)

---

## 5. Cómo agregar una nueva feature

Seguir este orden. No saltear pasos.

### Paso 1 — Domain (`libs/core/domain/`)
- Entidad: clase TypeScript plana, sin decoradores, sin imports de Prisma/NestJS
- Si hay nueva excepción de negocio: agregar clase a `batch-cooking.exceptions.ts` + entrada en `src/shared/constants/domain-exceptions-http.map.ts`

### Paso 2 — Repositorio abstracto (`libs/core/domain-services/repositories/`)
```typescript
export abstract class FooRepository {
  abstract findById(id: string): Promise<Foo | null>;
  abstract create(data: CreateFooInput): Promise<Foo>;
}
```
Exportar desde `libs/core/domain-services/index.ts`.

### Paso 3 — Use case (`libs/core/use-cases/<área>/`)
```typescript
export interface CreateFooInput { userId: string; ...; traceId: string; }

export class CreateFooUseCase {
  constructor(private readonly fooRepository: FooRepository) {}
  async execute(input: CreateFooInput): Promise<Foo> { ... }
}
```
- Solo importa de `../../domain/` y `../../domain-services/`
- Siempre incluye `traceId: string` en el input
- Exportar desde `libs/core/use-cases/index.ts`

### Paso 4 — Mapper (`libs/infrastructure/services/implementations/mappers/`)
```typescript
export class FooMapper {
  static toDomain(record: PrismaFoo): Foo { return { id: record.id, ... }; }
}
```

### Paso 5 — Repositorio concreto (`libs/infrastructure/services/implementations/`)
```typescript
export class PrismaFooRepository extends FooRepository {
  constructor(private readonly prisma: PrismaService) { super(); }
  async findById(id: string): Promise<Foo | null> {
    try {
      const r = await this.prisma.foo.findUnique({ where: { id } });
      return r ? FooMapper.toDomain(r) : null;
    } catch (err) {
      throw new DataSourceException(`Failed to find foo: ${(err as Error).message}`);
    }
  }
}
```
Todos los errores Prisma → `DataSourceException`. Exportar desde `libs/infrastructure/index.ts`.

### Paso 6 — Módulo NestJS (`src/modules/<feature>/`)
- Importar `ConfigModule` + `PrismaModule` (+ `GcpStorageModule` si usa GCS)
- Incluir siempre: `Reflector`, `SupabaseJwtGuard`, `UserProfileRepository`, `RolesGuard`
- Agregar el módulo a `src/app.module.ts`

### Paso 7 — Controller
- `@UseGuards(SupabaseJwtGuard, RolesGuard)` a nivel de clase
- `@Roles(UserRole.X)` en cada endpoint
- `@ApiOperation({ summary: '...', operationId: '...' })` en cada endpoint
- DTOs con `class-validator` (`@IsString()`, `@IsUUID()`, `@IsEnum()`, etc.)
- Solo orquesta use cases, sin lógica de negocio

---

## 6. Autenticación y Autorización

```
Request → SupabaseJwtGuard
            └── valida firma JWT con ConfigService.supabaseJwtSecret (sin DB)
            └── extrae userId del claim 'sub' → req.user = { id }
        → RolesGuard
            └── consulta user_profiles para obtener el rol
            └── ADMIN hereda todos los permisos de STAFF
            └── popula req.user.role
        → Controller
```

- El rol **no** viene en el JWT. Se consulta `user_profiles` en cada request.
- `req.user.id` y `req.globalTraceId` siempre disponibles en los controllers.
- Roles: `CLIENT`, `STAFF`, `ADMIN`

---

## 7. Manejo de errores

Flujo: `DomainException` lanzada en use-case → capturada por `GenericExceptionFilter` → mapeada a HTTP via `DOMAIN_EXCEPTIONS_HTTP_MAP`.

```json
{ "statusCode": 409, "code": "order-capacity-exceeded", "errorMessage": "...", "path": "/v1/...", "timestamp": "..." }
```

| Excepción | HTTP | Code |
|---|---|---|
| `DataSourceException` | 500 | `data-source-exception` |
| `DataNotFoundException` | 404 | `data-not-found-exception` |
| `DataInputException` | 400 | `data-input-exception` |
| `OrderCapacityExceededException` | 409 | `order-capacity-exceeded` |
| `OrderWindowClosedException` | 422 | `order-window-closed` |
| `OrderNotEditableException` | 422 | `order-not-editable` |
| `UnauthorizedAccessException` | 403 | `unauthorized-access` |

---

## 8. Configuración (`PLATFORM_CONFIG`)

**Regla estricta:** ningún servicio lee `process.env` directamente. Usar `ConfigService`.

- `dev`: lee `config/dev.json` (gitignoreado, cada dev crea el suyo)
- `prod`: Cloud Run inyecta `PLATFORM_CONFIG` como env var desde Secret Manager

```json
{
  "supabase": { "url": "https://xxxx.supabase.co", "jwtSecret": "..." },
  "gcp": { "projectId": "...", "storageBucket": "..." }
}
```

Getters disponibles: `configService.env`, `.supabaseUrl`, `.supabaseJwtSecret`, `.gcpProjectId`, `.gcpStorageBucket`

---

## 9. Endpoints — Estado actual (todos implementados)

### CLIENT
| Método | Ruta | Use Case |
|---|---|---|
| GET | `/v1/profile/me` | `GetProfileUseCase` |
| GET | `/v1/catalog/:weekIdentifier` | `GetWeeklyMenuUseCase` |
| GET | `/v1/delivery-zones` | `ListDeliveryZonesUseCase` (solo activas) |
| GET | `/v1/delivery-addresses` | `ListDeliveryAddressesUseCase` |
| POST | `/v1/delivery-addresses` | `CreateDeliveryAddressUseCase` |
| PUT | `/v1/delivery-addresses/:id` | `UpdateDeliveryAddressUseCase` |
| DELETE | `/v1/delivery-addresses/:id` | `DeleteDeliveryAddressUseCase` |
| POST | `/v1/orders` | `CreateOrderUseCase` |
| GET | `/v1/orders?week=2026-W16` | `ListUserOrdersUseCase` |
| GET | `/v1/orders/:orderId` | `GetOrderDetailUseCase` |
| PATCH | `/v1/orders/:orderId/package` | `ApplyWeeklyPackageUseCase` |
| PATCH | `/v1/orders/:orderId/items` | `UpsertDailySelectionUseCase` |
| POST | `/v1/orders/:orderId/checkout` | `InitiateCheckoutUseCase` |
| POST | `/v1/orders/:orderId/voucher-upload-url` | `GenerateVoucherUploadUrlUseCase` |
| POST | `/v1/orders/:orderId/confirm-voucher` | `ConfirmVoucherUploadUseCase` |
| PATCH | `/v1/orders/:orderId/cancel` | `CancelOrderUseCase` |
| DELETE | `/v1/orders/:orderId` | `DeleteDraftOrderUseCase` |

### STAFF (ADMIN también puede usar todos estos)
| Método | Ruta | Use Case |
|---|---|---|
| POST | `/v1/catalog/dishes` | `CreateCatalogDishUseCase` |
| DELETE | `/v1/catalog/dishes/:id` | `DeleteCatalogDishUseCase` |
| PUT | `/v1/catalog/packages` | `UpsertWeeklyPackageUseCase` |
| GET | `/v1/operations/orders/pending-payment?week=` | `ListPendingPaymentOrdersUseCase` |
| GET | `/v1/operations/orders/:orderId/voucher` | `GetVoucherSignedUrlUseCase` |
| POST | `/v1/operations/orders/:orderId/deliver` | `MarkOrderAsDeliveredUseCase` |
| GET | `/v1/operations/reports/production?week=` | `GenerateProductionReportUseCase` |
| GET | `/v1/operations/reports/delivery?week=` | `GetDeliveryListUseCase` |
| POST | `/v1/orders/:orderId/confirm-payment` | `ConfirmPaymentUseCase` |

### ADMIN
| Método | Ruta | Use Case |
|---|---|---|
| PUT | `/v1/admin/weekly-configs` | `UpsertWeeklyConfigUseCase` |
| PATCH | `/v1/admin/delivery-zones/:id` | `ToggleDeliveryZoneUseCase` |
| POST | `/v1/admin/cleanup-vouchers` | `CleanupExpiredVouchersUseCase` |

---

## 10. Modelos de dominio

### Entidades clave

```typescript
Order {
  id, userId, weekIdentifier,        // "2026-W16"
  deliveryAddressId, sourcePackageId?,
  subtotal, discountApplied, total,  // PEN, sin redondeo
  status: OrderStatus,
  ticketNumber?,                     // "TK-2026W16-0001"
  voucherPath?, deliveredAt?,
  items?: OrderItem[]
}

OrderItem { id, orderId, dayOfWeek(1–5), mealType, dishId, sideId? }
// Unique constraint: (orderId, dayOfWeek, mealType)

CatalogDish { id, weekIdentifier, name, type: DishType, price }
WeeklyPackage { id, weekIdentifier, name, description?, discountPercentage }
WeeklyPackageItem { id, packageId, dayOfWeek, mealType, dishId, sideId? }
WeeklyConfig { id, weekIdentifier(unique), startDate, maxOrders, discountPercentage, isActive }
DeliveryZone { id, districtName, isActive }
DeliveryAddress { id, userId, label, addressLine, districtId, reference? }
UserProfile { id, role: UserRole }
```

### Enums

```typescript
OrderStatus: DRAFT | PENDING_PAYMENT | CONFIRMED | DELIVERED | CANCELLED
UserRole:    CLIENT | STAFF | ADMIN
MealType:    LUNCH | DINNER
DishType:    MAIN | SIDE | DESSERT | DRINK
```

---

## 11. Reglas de negocio críticas

### Ventana de pedidos
- **Abierta:** Lunes a Viernes hasta las 12:00 PM hora de Lima (UTC-5)
- **Cerrada:** Viernes ≥ 12:00 PM, sábado y domingo
- `isOrderWindowOpen()` en `libs/shared/week-identifier.utils.ts`
- El backend valida en `InitiateCheckoutUseCase`, `CreateOrderUseCase` y `CancelOrderUseCase`

### Order capping (`maxOrders`)
- Solo órdenes `CONFIRMED` y `DELIVERED` consumen cupo (no `PENDING_PAYMENT`)
- Se verifica en `InitiateCheckoutUseCase` con transacción atómica (`SELECT ... FOR UPDATE`)
- Las cancelaciones liberan cupo automáticamente

### Flujo de estados
```
DRAFT → checkout → PENDING_PAYMENT → confirm-payment → CONFIRMED → deliver → DELIVERED
  ↓                     ↓                  ↓
CANCELLED           CANCELLED          CANCELLED   (solo si ventana abierta)
```

### Descuentos (calculados al hacer checkout)
| Situación | Descuento |
|---|---|
| Paquete aplicado, ningún ítem modificado | `weekly_packages.discount_percentage` |
| Paquete aplicado + ítem modificado | `weekly_configs.discount_percentage` |
| Armado manual | `weekly_configs.discount_percentage` |

Si el usuario modifica un ítem tras aplicar un paquete, `source_package_id` se anula en la orden.

### Número de ticket
- Formato: `TK-{AÑO}W{SEMANA}-{SECUENCIAL_4_DÍGITOS}` → `TK-2026W16-0001`
- El secuencial reinicia en 0001 cada semana
- Se genera al pasar a `PENDING_PAYMENT`

### Vouchers
- El archivo **nunca pasa por NestJS**. El backend solo genera la Signed URL (válida 10 min).
- Signed URL de lectura (staff): 15 min
- Limpieza: `CleanupExpiredVouchersUseCase` borra vouchers de órdenes `DELIVERED` con `delivered_at` > 30 días

### `weekIdentifier` format
- Siempre `YYYY-WNN` (ej. `2026-W16`)
- Regex de validación: `/^\d{4}-W\d{2}$/`

---

## 12. Flujo de subida de voucher

```
1. POST /orders/:id/voucher-upload-url → backend genera Signed Upload URL (10 min) + objectName
2. PUT {uploadUrl} directo a GCP (sin Authorization header del backend)
   Headers: Content-Type: <mime type del archivo>
   Body: archivo original, sin compresión
3. POST /orders/:id/confirm-voucher { objectName } → backend registra voucher_path
```

---

## 13. Prisma Schema — tablas principales

```
user_profiles        (id FK→auth.users, role)
delivery_zones       (id, district_name, is_active)
delivery_addresses   (id, user_id, label, address_line, district_id FK→zones, reference?)
weekly_configs       (id, week_identifier UNIQUE, start_date, max_orders, discount_percentage, is_active)
catalog_dishes       (id, week_identifier FK→configs, name, type, price)
weekly_packages      (id, week_identifier FK→configs, name, description?, discount_percentage)
weekly_package_items (id, package_id, day_of_week, meal_type, dish_id, side_id?)
orders               (id, user_id, week_identifier, delivery_address_id, source_package_id?,
                      subtotal?, discount_applied?, total?, status, ticket_number? UNIQUE,
                      voucher_path?, delivered_at?, created_at, updated_at)
order_items          (id, order_id, day_of_week, meal_type, dish_id, side_id?)
                     UNIQUE (order_id, day_of_week, meal_type)
```

---

## 14. Testing

```typescript
// jest.config.ts — moduleNameMapper resuelve los path aliases
'^@batch-cooking/domain(.*)$':          '<rootDir>/libs/core/domain$1'
'^@batch-cooking/domain-services(.*)$': '<rootDir>/libs/core/domain-services$1'
// etc.
```

| Capa | Tipo | Qué mockear |
|---|---|---|
| `libs/core/domain/` | Unitario puro | Nada |
| `libs/core/use-cases/` | Unitario | Abstract repositories (jest.fn()) |
| `libs/infrastructure/` | Integración | DB real |
| `src/modules/` | Unitario con TestingModule | Use cases |

**Prioridad:** `InitiateCheckoutUseCase` (capping atómico) y `discount.utils.ts`.

---

## 15. Docker y despliegue

- Multi-stage build: `builder` (compila) → `runner` (solo `dist/` + `node_modules` prod)
- `USER node` en la imagen final (no root)
- CMD: `npx prisma migrate deploy && node dist/main`
- Cloud Run con `min-instances: 0` → cold starts posibles en producción
- Swagger disponible en `{BASE}/docs` solo en entornos no-prod
- Puerto por defecto: `8080`

---

## 16. Convenciones de código

- Sin comentarios salvo que el **por qué** sea no obvio
- Sin `process.env` fuera de `ConfigService`
- Todas las fechas se almacenan en UTC; lógica de ventana horaria usa `America/Lima`
- Precios en PEN, sin redondeo en ningún cálculo
- `dayOfWeek`: 1=Lunes … 5=Viernes
- Los errores de Prisma siempre se capturan y relanza como `DataSourceException`
- Cada módulo NestJS provee sus propios `Reflector`, `SupabaseJwtGuard` y `RolesGuard`
