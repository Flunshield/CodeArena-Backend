import {Injectable} from '@nestjs/common';
import {Titles, User} from '../../interfaces/userInterface';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AdminService {
    async updateTitle(title: Titles) {
        return prisma.title.update({
            where: {
                id: title.id,
            },
            data: {
                label: title.label,
                value: title.value,
            },
        });
    }

    async deleteTitle(title: Titles) {
        return prisma.title.delete({
            where: {
                id: title.id,
            },
        });
    }

    async createTitles(title: Titles) {
        return prisma.title.create({
            data: {
                label: title.label,
                value: title.value,
            },
        });
    }

    async deleteUser(user: User) {
        // TODO: Implémenter l'utilisateur dans la table historie ?
        // Supprimer les entrées liées dans userRanking
        await prisma.userRanking.deleteMany({
            where: {
                userID: user.id
            }
        });

        // Supprimer les entrées liées dans userTournament
        await prisma.userTournament.deleteMany({
            where: {
                userID: user.id
            }
        });

        // Supprimer les entrées liées dans userMatch
        await prisma.userMatch.deleteMany({
            where: {
                userID: user.id
            }
        });

        // Supprimer les entrées liées dans userEvent
        await prisma.userEvent.deleteMany({
            where: {
                userID: user.id
            }
        });

        // Supprimer l'utilisateur lui-même
        return prisma.user.delete({
            where: {
                id: user.id
            }
        });
    }

    async patchPointsUser(user: User) {
        const userRankingEntry = await prisma.userRanking.findFirst({
            where: {
                userID: user.id
            }
        });

        if (!userRankingEntry) {
            throw new Error(`No userRanking entry found for user with ID ${user.id}`);
        }

        return prisma.userRanking.update({
            where: {
                id: userRankingEntry.id
            },
            data: {
                points: 0,
                rankingsID: 1
            }
        });
    }
}
