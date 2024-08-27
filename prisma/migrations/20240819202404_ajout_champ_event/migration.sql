/*
  Warnings:

  - Added the required column `userIDEntreprise` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `events` ADD COLUMN `commandeId` INTEGER NULL,
    ADD COLUMN `statusPayment` VARCHAR(191) NOT NULL DEFAULT 'not paid',
    ADD COLUMN `userIDEntreprise` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandeEntreprise`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_userIDEntreprise_fkey` FOREIGN KEY (`userIDEntreprise`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
