/*
  Warnings:

  - A unique constraint covering the columns `[deliveryAddressId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_deliveryAddressId_key" ON "Order"("deliveryAddressId");
