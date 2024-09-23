-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `userName` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastLogin` DATETIME(3) NULL,
    `languagePreference` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'inactive',
    `avatar` VARCHAR(191) NULL,
    `localisation` VARCHAR(191) NULL,
    `titlesId` INTEGER NULL,
    `titlesWin` JSON NULL,
    `badgesWin` JSON NULL,
    `company` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `school` VARCHAR(191) NULL,
    `github` VARCHAR(191) NULL,
    `presentation` VARCHAR(191) NULL,
    `nbGames` INTEGER NULL DEFAULT 0,
    `groupsId` INTEGER NOT NULL DEFAULT 1,
    `siren` VARCHAR(191) NULL,

    UNIQUE INDEX `user_userName_key`(`userName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Title` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `roles` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userID` INTEGER NULL,
    `modificationType` VARCHAR(191) NOT NULL,
    `details` VARCHAR(191) NOT NULL,
    `modificationDate` DATETIME(3) NOT NULL,
    `oldValue` VARCHAR(191) NOT NULL,
    `newValue` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tournaments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `playerMax` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `rewards` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rankings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `rewards` VARCHAR(191) NOT NULL,
    `maxPoints` DOUBLE NOT NULL,
    `minPoints` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `score` VARCHAR(191) NOT NULL,
    `tournamentID` INTEGER NULL,
    `rankingsID` INTEGER NULL,
    `eventsID` INTEGER NULL,
    `winnerId` INTEGER NULL,
    `winnerPoints` DOUBLE NULL,
    `loserId` INTEGER NULL,
    `loserPoints` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userRanking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userID` INTEGER NOT NULL,
    `rankingsID` INTEGER NOT NULL,
    `points` DOUBLE NOT NULL,

    UNIQUE INDEX `userRanking_userID_rankingsID_key`(`userID`, `rankingsID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userTournament` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userID` INTEGER NOT NULL,
    `tournamentID` INTEGER NOT NULL,
    `points` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userMatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userID` INTEGER NOT NULL,
    `matchID` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `playerMax` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `rewards` VARCHAR(191) NOT NULL,
    `organize` VARCHAR(191) NOT NULL,
    `createPuzzles` BOOLEAN NOT NULL,
    `priceAdjustment` INTEGER NOT NULL,
    `basePrice` DOUBLE NOT NULL DEFAULT 1000.0,
    `priceDetails` JSON NULL,
    `accepted` BOOLEAN NOT NULL DEFAULT false,
    `statusPayment` VARCHAR(191) NOT NULL DEFAULT 'not paid',
    `userIDEntreprise` INTEGER NOT NULL,
    `commandeId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userID` INTEGER NOT NULL,
    `eventsID` INTEGER NOT NULL,
    `points` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `puzzles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rankingsID` INTEGER NULL,
    `tournamentID` INTEGER NULL,
    `eventsID` INTEGER NULL,
    `tests` JSON NOT NULL,
    `details` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commandeEntreprise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idSession` VARCHAR(191) NOT NULL,
    `objetSession` JSON NOT NULL,
    `idPayment` VARCHAR(191) NOT NULL,
    `item` VARCHAR(191) NOT NULL,
    `userID` INTEGER NOT NULL,
    `dateCommande` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `etatCommande` VARCHAR(191) NOT NULL,
    `nbCreateTest` INTEGER NOT NULL DEFAULT 10,
    `customerId` VARCHAR(191) NULL,

    UNIQUE INDEX `commandeEntreprise_idSession_key`(`idSession`),
    UNIQUE INDEX `commandeEntreprise_idPayment_key`(`idPayment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `puzzlesEntreprise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userID` INTEGER NOT NULL,
    `tests` JSON NOT NULL,
    `details` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL DEFAULT '600',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `validated` BOOLEAN NOT NULL DEFAULT false,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `result` JSON NULL,
    `testValidated` INTEGER NULL,
    `time` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `activate` BOOLEAN NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_titlesId_fkey` FOREIGN KEY (`titlesId`) REFERENCES `Title`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_groupsId_fkey` FOREIGN KEY (`groupsId`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `histories` ADD CONSTRAINT `histories_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_tournamentID_fkey` FOREIGN KEY (`tournamentID`) REFERENCES `tournaments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_rankingsID_fkey` FOREIGN KEY (`rankingsID`) REFERENCES `rankings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_eventsID_fkey` FOREIGN KEY (`eventsID`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userRanking` ADD CONSTRAINT `userRanking_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userRanking` ADD CONSTRAINT `userRanking_rankingsID_fkey` FOREIGN KEY (`rankingsID`) REFERENCES `rankings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userTournament` ADD CONSTRAINT `userTournament_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userTournament` ADD CONSTRAINT `userTournament_tournamentID_fkey` FOREIGN KEY (`tournamentID`) REFERENCES `tournaments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userMatch` ADD CONSTRAINT `userMatch_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userMatch` ADD CONSTRAINT `userMatch_matchID_fkey` FOREIGN KEY (`matchID`) REFERENCES `matches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandeEntreprise`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_userIDEntreprise_fkey` FOREIGN KEY (`userIDEntreprise`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userEvent` ADD CONSTRAINT `userEvent_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userEvent` ADD CONSTRAINT `userEvent_eventsID_fkey` FOREIGN KEY (`eventsID`) REFERENCES `events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `puzzles` ADD CONSTRAINT `puzzles_rankingsID_fkey` FOREIGN KEY (`rankingsID`) REFERENCES `rankings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `puzzles` ADD CONSTRAINT `puzzles_tournamentID_fkey` FOREIGN KEY (`tournamentID`) REFERENCES `tournaments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `puzzles` ADD CONSTRAINT `puzzles_eventsID_fkey` FOREIGN KEY (`eventsID`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commandeEntreprise` ADD CONSTRAINT `commandeEntreprise_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `puzzlesEntreprise` ADD CONSTRAINT `puzzlesEntreprise_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `puzzleSend` ADD CONSTRAINT `puzzleSend_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `puzzleSend` ADD CONSTRAINT `puzzleSend_puzzlesEntrepriseId_fkey` FOREIGN KEY (`puzzlesEntrepriseId`) REFERENCES `puzzlesEntreprise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cvUser` ADD CONSTRAINT `cvUser_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
