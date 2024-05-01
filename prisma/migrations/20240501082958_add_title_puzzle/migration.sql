/*
  Warnings:

  - Added the required column `title` to the `puzzles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `puzzlesEntreprise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `puzzles` ADD COLUMN `title` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `puzzlesEntreprise` ADD COLUMN `title` VARCHAR(191) NOT NULL;
