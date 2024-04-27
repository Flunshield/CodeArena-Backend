-- CreateTable
CREATE TABLE `puzzleSend` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userID` INTEGER NOT NULL,
    `puzzlesEntrepriseId` INTEGER NOT NULL,
    `sendDate` DATETIME(3) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `commentaire` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `puzzleSend` ADD CONSTRAINT `puzzleSend_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `puzzleSend` ADD CONSTRAINT `puzzleSend_puzzlesEntrepriseId_fkey` FOREIGN KEY (`puzzlesEntrepriseId`) REFERENCES `puzzlesEntreprise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
