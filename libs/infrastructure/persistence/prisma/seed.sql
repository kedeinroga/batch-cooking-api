-- Seed data for local development
-- Week: 2026-W17 (April 21–25, 2026)

-- Delivery zones
INSERT INTO delivery_zones (id, district_name, is_active) VALUES
  ('dz-miraflores',   'Miraflores',   true),
  ('dz-san-isidro',   'San Isidro',   true),
  ('dz-surco',        'Santiago de Surco', true),
  ('dz-barranco',     'Barranco',     true),
  ('dz-san-borja',    'San Borja',    true)
ON CONFLICT (id) DO NOTHING;

-- Weekly config for 2026-W17
INSERT INTO weekly_configs (id, week_identifier, start_date, max_orders, discount_percentage, is_active) VALUES
  ('wc-2026-w17', '2026-W17', '2026-04-21T00:00:00Z', 50, 5, true)
ON CONFLICT (week_identifier) DO UPDATE SET is_active = true;

-- Catalog dishes for 2026-W17
INSERT INTO catalog_dishes (id, week_identifier, name, type, price) VALUES
  -- Mains (LUNCH)
  ('cd-pollo-saltado',    '2026-W17', 'Pollo Saltado',          'MAIN',    18.00),
  ('cd-lomo-saltado',     '2026-W17', 'Lomo Saltado',           'MAIN',    22.00),
  ('cd-aji-de-gallina',   '2026-W17', 'Ají de Gallina',         'MAIN',    17.00),
  ('cd-arroz-con-leche',  '2026-W17', 'Arroz con Leche',        'MAIN',    15.00),
  ('cd-causa-limena',     '2026-W17', 'Causa Limeña de Pollo',  'MAIN',    16.00),
  -- Sides
  ('cd-arroz-blanco',     '2026-W17', 'Arroz Blanco',           'SIDE',     4.00),
  ('cd-ensalada-mixta',   '2026-W17', 'Ensalada Mixta',         'SIDE',     5.00),
  ('cd-papa-sancochada',  '2026-W17', 'Papa Sancochada',        'SIDE',     4.00),
  -- Desserts
  ('cd-flan',             '2026-W17', 'Flan Casero',            'DESSERT',  6.00),
  ('cd-mazamorra',        '2026-W17', 'Mazamorra Morada',       'DESSERT',  5.00),
  -- Drinks
  ('cd-chicha',           '2026-W17', 'Chicha Morada',          'DRINK',    4.00),
  ('cd-limonada',         '2026-W17', 'Limonada',               'DRINK',    4.00)
ON CONFLICT (id) DO NOTHING;

-- Weekly package for 2026-W17
INSERT INTO weekly_packages (id, week_identifier, name, description, discount_percentage) VALUES
  ('wp-completo-w17', '2026-W17', 'Paquete Completo', 'Almuerzo + Cena de Lunes a Viernes', 10)
ON CONFLICT (id) DO NOTHING;

-- Package items: Lunes-Viernes, LUNCH + DINNER
INSERT INTO weekly_package_items (id, package_id, day_of_week, meal_type, dish_id, side_id) VALUES
  -- Lunes
  ('wpi-l1', 'wp-completo-w17', 1, 'LUNCH',  'cd-pollo-saltado',  'cd-arroz-blanco'),
  ('wpi-l2', 'wp-completo-w17', 1, 'DINNER', 'cd-causa-limena',   NULL),
  -- Martes
  ('wpi-m1', 'wp-completo-w17', 2, 'LUNCH',  'cd-lomo-saltado',   'cd-papa-sancochada'),
  ('wpi-m2', 'wp-completo-w17', 2, 'DINNER', 'cd-aji-de-gallina', 'cd-arroz-blanco'),
  -- Miércoles
  ('wpi-x1', 'wp-completo-w17', 3, 'LUNCH',  'cd-aji-de-gallina', 'cd-ensalada-mixta'),
  ('wpi-x2', 'wp-completo-w17', 3, 'DINNER', 'cd-pollo-saltado',  NULL),
  -- Jueves
  ('wpi-j1', 'wp-completo-w17', 4, 'LUNCH',  'cd-causa-limena',   NULL),
  ('wpi-j2', 'wp-completo-w17', 4, 'DINNER', 'cd-lomo-saltado',   'cd-ensalada-mixta'),
  -- Viernes
  ('wpi-v1', 'wp-completo-w17', 5, 'LUNCH',  'cd-arroz-con-leche','cd-arroz-blanco'),
  ('wpi-v2', 'wp-completo-w17', 5, 'DINNER', 'cd-causa-limena',   NULL)
ON CONFLICT (id) DO NOTHING;
