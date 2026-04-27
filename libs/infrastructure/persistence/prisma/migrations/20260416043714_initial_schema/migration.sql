-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'CONFIRMED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('LUNCH', 'DINNER');

-- CreateEnum
CREATE TYPE "DishType" AS ENUM ('MAIN', 'SIDE', 'DESSERT', 'DRINK');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'STAFF', 'ADMIN');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "district_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "reference" TEXT,

    CONSTRAINT "delivery_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_configs" (
    "id" TEXT NOT NULL,
    "week_identifier" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "max_orders" INTEGER NOT NULL,
    "discount_percentage" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "weekly_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_dishes" (
    "id" TEXT NOT NULL,
    "week_identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DishType" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "catalog_dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_packages" (
    "id" TEXT NOT NULL,
    "week_identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discount_percentage" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "weekly_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_package_items" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "dish_id" TEXT NOT NULL,
    "side_id" TEXT,

    CONSTRAINT "weekly_package_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_identifier" TEXT NOT NULL,
    "delivery_address_id" TEXT NOT NULL,
    "source_package_id" TEXT,
    "subtotal" DECIMAL(65,30),
    "discount_applied" DECIMAL(65,30),
    "total" DECIMAL(65,30),
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "ticket_number" TEXT,
    "voucher_path" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "dish_id" TEXT NOT NULL,
    "side_id" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_configs_week_identifier_key" ON "weekly_configs"("week_identifier");

-- CreateIndex
CREATE UNIQUE INDEX "orders_ticket_number_key" ON "orders"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_id_day_of_week_meal_type_key" ON "order_items"("order_id", "day_of_week", "meal_type");

-- AddForeignKey
ALTER TABLE "delivery_addresses" ADD CONSTRAINT "delivery_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_addresses" ADD CONSTRAINT "delivery_addresses_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "delivery_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_dishes" ADD CONSTRAINT "catalog_dishes_week_identifier_fkey" FOREIGN KEY ("week_identifier") REFERENCES "weekly_configs"("week_identifier") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_packages" ADD CONSTRAINT "weekly_packages_week_identifier_fkey" FOREIGN KEY ("week_identifier") REFERENCES "weekly_configs"("week_identifier") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_package_items" ADD CONSTRAINT "weekly_package_items_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "weekly_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_package_items" ADD CONSTRAINT "weekly_package_items_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "catalog_dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_package_items" ADD CONSTRAINT "weekly_package_items_side_id_fkey" FOREIGN KEY ("side_id") REFERENCES "catalog_dishes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "delivery_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_package_id_fkey" FOREIGN KEY ("source_package_id") REFERENCES "weekly_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "catalog_dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_side_id_fkey" FOREIGN KEY ("side_id") REFERENCES "catalog_dishes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
