-- CreateTable
CREATE TABLE `cvUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cvName` VARCHAR(191) NULL,
    `userID` INTEGER NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `summary` VARCHAR(191) NULL,
    `experiences` JSON NULL,
    `educations` JSON NULL,
    `technicalSkills` JSON NULL,
    `softSkills` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cvUser` ADD CONSTRAINT `cvUser_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
