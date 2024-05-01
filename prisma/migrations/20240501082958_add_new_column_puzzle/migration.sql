/*
  Warnings:

  - Added the required column `title` to the `puzzles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `puzzlesEntreprise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `puzzles` ADD COLUMN `title` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `puzzlesEntreprise` ADD COLUMN `title` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `puzzleSend` ADD COLUMN `validated` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `puzzleSend` ADD COLUMN `result` JSON NULL;
ALTER TABLE `puzzleSend` ADD COLUMN `testValidated` INTEGER NULL;
ALTER TABLE `puzzleSend` ADD COLUMN `time` VARCHAR(191) NULL;
