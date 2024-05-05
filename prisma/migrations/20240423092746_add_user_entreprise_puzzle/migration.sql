/*
  Warnings:

  - Added the required column `userID` to the `puzzlesEntreprise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `puzzlesEntreprise` ADD COLUMN `userID` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `puzzlesEntreprise` ADD CONSTRAINT `puzzlesEntreprise_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
