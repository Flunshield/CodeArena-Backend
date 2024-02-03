import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Tournament } from '../../interfaces/userInterface';

const prisma: PrismaClient = new PrismaClient();
@Injectable()
export class TournamentService {
  async findTournamentwithTheEarliestDate() {
    const tournament: Tournament = await prisma.tournaments.findFirst({
      where: {
        startDate: {
          gte: new Date(), // Pour s'assurer que la date est dans le futur
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
    return tournament;
  }

  async findNextTenTournament() {
    const tournament: Tournament[] = await prisma.tournaments.findMany({
      where: {
        startDate: {
          gte: new Date(), // Pour s'assurer que la date est dans le futur
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 10,
    });
    return tournament;
  }
}
