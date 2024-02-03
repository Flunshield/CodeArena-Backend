import {Injectable} from '@nestjs/common';
import {PrismaClient} from '@prisma/client';
import {Event, Tournament} from '../../interfaces/userInterface';

const prisma: PrismaClient = new PrismaClient();

@Injectable()
export class DashboardService {
  async checkRankUser(id: number) {
    const userWithRankings = await prisma.userRanking.findFirst({
      where: {
        userID: id,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            avatar: true,
          },
        },
      },
    });
    const points = userWithRankings.points;

    const usersAbove = await prisma.userRanking.findMany({
      where: {
        points: {
          gt: points,
        },
        userID: {
          not: id,
        },
      },
      orderBy: {
        points: 'desc',
      },
      take: 2,
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            avatar: true,
          },
        },
      },
    });

    const usersBelow = await prisma.userRanking.findMany({
      where: {
        points: {
          lte: points,
        },
        userID: {
          not: id,
        },
      },
      orderBy: {
        points: 'desc',
      },
      take: 2,
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            avatar: true,
          },
        },
      },
    });

    const listUser = {
      usersAbove: usersAbove,
      user: userWithRankings,
      usersBelow: usersBelow,
    };

    return listUser ?? {};
  }

  async findTournamentwithTheEarliestDate() {
    const tournament: Tournament = await prisma.tournaments.findFirst({
      where: {
        startDate: {
          gt: new Date(), // Pour s'assurer que la date est dans le futur
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return tournament;
  }

  async findEvent(): Promise<Event[]> {
    return prisma.events.findMany({
      where: {
        startDate: {
          gte: new Date(), // Pour s'assurer que la date est dans le futur
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }
}
