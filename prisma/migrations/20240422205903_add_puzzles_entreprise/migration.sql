-- CreateTable
CREATE TABLE `puzzlesEntreprise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tests` JSON NOT NULL,
    `details` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
