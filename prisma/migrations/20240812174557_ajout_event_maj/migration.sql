/*
  Warnings:

  - You are about to drop the column `finalPrice` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `events` DROP COLUMN `finalPrice`,
    ADD COLUMN `priceDetails` JSON NULL;
