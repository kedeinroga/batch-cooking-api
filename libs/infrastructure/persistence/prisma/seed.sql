-- Seed data for local development
-- Week: 2026-W17 (April 21–25, 2026)
-- All IDs are proper UUIDs to satisfy @IsUUID() validators in the API DTOs.

-- Cleanup existing 2026-W17 data (safe to re-run)
DELETE FROM orders WHERE week_identifier = '2026-W17';
DELETE FROM weekly_package_items WHERE package_id IN (
  SELECT id FROM weekly_packages WHERE week_identifier = '2026-W17'
);
DELETE FROM weekly_packages WHERE week_identifier = '2026-W17';
DELETE FROM catalog_dishes WHERE week_identifier = '2026-W17';

-- Delivery zones (inserted once; gen_random_uuid is fine — never referenced by @IsUUID DTO directly)
INSERT INTO delivery_zones (id, district_name, is_active) VALUES
  (gen_random_uuid()::text, 'Miraflores',        true),
  (gen_random_uuid()::text, 'San Isidro',         true),
  (gen_random_uuid()::text, 'Santiago de Surco',  true),
  (gen_random_uuid()::text, 'Barranco',           true),
  (gen_random_uuid()::text, 'San Borja',          true)
ON CONFLICT DO NOTHING;

-- Weekly config for 2026-W17
INSERT INTO weekly_configs (id, week_identifier, start_date, max_orders, discount_percentage, is_active) VALUES
  ('wc-2026-w17', '2026-W17', '2026-04-21T00:00:00Z', 50, 5, true)
ON CONFLICT (week_identifier) DO UPDATE SET is_active = true;

-- Catalog dishes for 2026-W17 — UUIDs required by UpsertDailySelectionRequestDto (@IsUUID on dishId/sideId)
INSERT INTO catalog_dishes (id, week_identifier, name, type, price) VALUES
  -- Mains
  ('d1000001-0000-4000-8000-202617000001', '2026-W17', 'Pollo Saltado',          'MAIN',    18.00),
  ('d1000002-0000-4000-8000-202617000001', '2026-W17', 'Lomo Saltado',           'MAIN',    22.00),
  ('d1000003-0000-4000-8000-202617000001', '2026-W17', 'Ají de Gallina',         'MAIN',    17.00),
  ('d1000004-0000-4000-8000-202617000001', '2026-W17', 'Arroz con Leche',        'MAIN',    15.00),
  ('d1000005-0000-4000-8000-202617000001', '2026-W17', 'Causa Limeña de Pollo',  'MAIN',    16.00),
  -- Sides
  ('d1000006-0000-4000-8000-202617000001', '2026-W17', 'Arroz Blanco',           'SIDE',     4.00),
  ('d1000007-0000-4000-8000-202617000001', '2026-W17', 'Ensalada Mixta',         'SIDE',     5.00),
  ('d1000008-0000-4000-8000-202617000001', '2026-W17', 'Papa Sancochada',        'SIDE',     4.00),
  -- Desserts
  ('d1000009-0000-4000-8000-202617000001', '2026-W17', 'Flan Casero',            'DESSERT',  6.00),
  ('d1000010-0000-4000-8000-202617000001', '2026-W17', 'Mazamorra Morada',       'DESSERT',  5.00),
  -- Drinks
  ('d1000011-0000-4000-8000-202617000001', '2026-W17', 'Chicha Morada',          'DRINK',    4.00),
  ('d1000012-0000-4000-8000-202617000001', '2026-W17', 'Limonada',               'DRINK',    4.00);

-- Weekly package — UUID required by ApplyWeeklyPackageRequestDto (@IsUUID on packageId)
INSERT INTO weekly_packages (id, week_identifier, name, description, discount_percentage) VALUES
  ('e1000001-0000-4000-8000-202617000001', '2026-W17', 'Paquete Completo', 'Almuerzo + Cena de Lunes a Viernes', 10);

-- Package items: Lunes–Viernes, LUNCH + DINNER
INSERT INTO weekly_package_items (id, package_id, day_of_week, meal_type, dish_id, side_id) VALUES
  -- Lunes
  ('f1000001-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 1, 'LUNCH',  'd1000001-0000-4000-8000-202617000001', 'd1000006-0000-4000-8000-202617000001'),
  ('f1000002-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 1, 'DINNER', 'd1000005-0000-4000-8000-202617000001', NULL),
  -- Martes
  ('f1000003-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 2, 'LUNCH',  'd1000002-0000-4000-8000-202617000001', 'd1000008-0000-4000-8000-202617000001'),
  ('f1000004-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 2, 'DINNER', 'd1000003-0000-4000-8000-202617000001', 'd1000006-0000-4000-8000-202617000001'),
  -- Miércoles
  ('f1000005-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 3, 'LUNCH',  'd1000003-0000-4000-8000-202617000001', 'd1000007-0000-4000-8000-202617000001'),
  ('f1000006-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 3, 'DINNER', 'd1000001-0000-4000-8000-202617000001', NULL),
  -- Jueves
  ('f1000007-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 4, 'LUNCH',  'd1000005-0000-4000-8000-202617000001', NULL),
  ('f1000008-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 4, 'DINNER', 'd1000002-0000-4000-8000-202617000001', 'd1000007-0000-4000-8000-202617000001'),
  -- Viernes
  ('f1000009-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 5, 'LUNCH',  'd1000004-0000-4000-8000-202617000001', 'd1000006-0000-4000-8000-202617000001'),
  ('f1000010-0000-4000-8000-202617000001', 'e1000001-0000-4000-8000-202617000001', 5, 'DINNER', 'd1000005-0000-4000-8000-202617000001', NULL);
