/*
  Warnings:

  - Added the required column `example` to the `puzzles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `puzzles` ADD COLUMN `example` VARCHAR(191) NOT NULL;
