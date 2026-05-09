# Batch Cooking API

Backend para la plataforma de batch cooking en Lima, Perú. Los clientes programan almuerzos y cenas de lunes a viernes; el staff valida pagos y gestiona entregas; el admin configura la semana.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | NestJS 11 + TypeScript |
| ORM | Prisma 7 |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Storage | Google Cloud Storage (vouchers de pago) |
| Deploy | Docker multi-stage → Cloud Run |
| Secretos | Google Secret Manager (`PLATFORM_CONFIG`) |
| Docs | Swagger (`/docs`) en entornos no-prod |

## Arquitectura

Clean Architecture hexagonal con tres capas principales:

```
libs/core/             → dominio puro (entidades, excepciones, use cases, repos abstractos)
libs/infrastructure/   → implementaciones concretas (Prisma, GCS)
libs/shared/           → utils transversales (semana ISO, hora Lima, descuentos, tickets)
src/modules/           → NestJS: DI, controllers, guards
```

Los path aliases están en `tsconfig.json`:

```
@batch-cooking/domain
@batch-cooking/domain-services
@batch-cooking/use-cases
@batch-cooking/infrastructure
@batch-cooking/shared
```

## Requisitos previos

- Node.js 20+
- npm 10+
- Acceso a un proyecto Supabase (PostgreSQL)
- Acceso a un bucket en Google Cloud Storage

## Configuración local

Crear el archivo `config/dev.json` (está en `.gitignore`):

```json
{
  "supabase": {
    "url": "https://xxxx.supabase.co",
    "jwtSecret": "tu-jwt-secret"
  },
  "gcp": {
    "projectId": "tu-gcp-project",
    "storageBucket": "tu-bucket-name"
  }
}
```

> En producción esta configuración llega como variable de entorno `PLATFORM_CONFIG` inyectada por Cloud Run desde Secret Manager.

## Comandos

```bash
npm install

# Desarrollo (hot reload)
npm run start:dev

# Build de producción
npm run build
npm run start:prod

# Tests
npm run test          # unitarios
npm run test:cov      # con cobertura
npm run test:e2e      # e2e

# Lint y formato
npm run lint
npm run format
```

## Migraciones de base de datos

```bash
# Aplicar migraciones en desarrollo
npx prisma migrate dev

# Aplicar migraciones en producción (lo hace el CMD del Dockerfile)
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio
```

## Docker

```bash
# Build de la imagen
docker build -t batch-cooking-api .

# Ejecutar con docker-compose (incluye variables de entorno)
docker-compose up
```

La imagen es multi-stage Alpine. El CMD final ejecuta `npx prisma migrate deploy && node dist/main`. Puerto: `8080`.

## API — Resumen de endpoints

Todos los endpoints requieren `Authorization: Bearer <supabase-jwt>`. La documentación completa está disponible en `/docs` cuando se corre en modo no-producción.

### Cliente (`CLIENT`)

| Método | Ruta |
|---|---|
| GET | `/v1/profile/me` |
| GET | `/v1/catalog/:weekIdentifier` |
| GET/POST/PUT/DELETE | `/v1/delivery-addresses` |
| GET | `/v1/delivery-zones` |
| POST | `/v1/orders` |
| GET | `/v1/orders?week=YYYY-WNN` |
| GET | `/v1/orders/:orderId` |
| PATCH | `/v1/orders/:orderId/items` |
| PATCH | `/v1/orders/:orderId/package` |
| POST | `/v1/orders/:orderId/checkout` |
| POST | `/v1/orders/:orderId/voucher-upload-url` |
| POST | `/v1/orders/:orderId/confirm-voucher` |
| PATCH | `/v1/orders/:orderId/cancel` |
| DELETE | `/v1/orders/:orderId` |

### Staff (`STAFF` / `ADMIN`)

| Método | Ruta |
|---|---|
| POST/DELETE | `/v1/catalog/dishes` |
| PUT | `/v1/catalog/packages` |
| GET | `/v1/operations/orders/pending-payment?week=` |
| GET | `/v1/operations/orders/:orderId/voucher` |
| POST | `/v1/operations/orders/:orderId/deliver` |
| GET | `/v1/operations/reports/production?week=` |
| GET | `/v1/operations/reports/delivery?week=` |
| POST | `/v1/orders/:orderId/confirm-payment` |

### Admin (`ADMIN`)

| Método | Ruta |
|---|---|
| PUT | `/v1/admin/weekly-configs` |
| PATCH | `/v1/admin/delivery-zones/:zoneId` |
| POST | `/v1/admin/cleanup-vouchers` |

## Estados de una orden

```
DRAFT → (checkout) → PENDING_PAYMENT → (confirm-payment) → CONFIRMED → (deliver) → DELIVERED
  ↓                       ↓                   ↓
CANCELLED             CANCELLED            CANCELLED
```

La ventana de pedidos cierra los **viernes a las 12:00 PM hora de Lima (UTC−5)**. El backend rechaza operaciones fuera de ventana con HTTP 422 (`order-window-closed`).

## Flujo de subida de voucher

El archivo nunca pasa por el backend:

1. `POST /orders/:id/voucher-upload-url` → `{ uploadUrl, objectName }`
2. `PUT {uploadUrl}` directo a GCS con el archivo en el body
3. `POST /orders/:id/confirm-voucher` con `{ objectName }`
