-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "applied_package_id" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_applied_package_id_fkey" FOREIGN KEY ("applied_package_id") REFERENCES "weekly_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
