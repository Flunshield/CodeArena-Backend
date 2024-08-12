/*
  Warnings:

  - Added the required column `createPuzzles` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `finalPrice` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceAdjustment` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `events` ADD COLUMN `basePrice` DOUBLE NOT NULL DEFAULT 1000.0,
    ADD COLUMN `createPuzzles` BOOLEAN NOT NULL,
    ADD COLUMN `finalPrice` DOUBLE NOT NULL,
    ADD COLUMN `priceAdjustment` INTEGER NOT NULL;
