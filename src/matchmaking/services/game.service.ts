import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaClient) {}

  //Update user ranking with logic
  async updateUserRanking(
    userId: number,
    rankingsId: number,
    pointsChange: number,
  ) {
    //Take the user ranking
    const userRanking = await this.prisma.userRanking.findFirst({
      where: {
        userID: userId,
        rankingsID: rankingsId,
      },
      select: {
        points: true,
      },
    });

    //Take all the ranks
    const ranks = await this.prisma.rankings.findMany({
      select: { id: true, maxPoints: true, minPoints: true },
    });

    if (userRanking) {
      //Calculating the new points
      const updatedPoints = Math.max(0, userRanking.points + pointsChange);

      //Find the appropriate rank
      const appropriateRank = ranks.find(
        (rank) =>
          updatedPoints >= rank.minPoints && updatedPoints <= rank.maxPoints,
      );

      //Update the user ranking
      await this.prisma.userRanking.update({
        where: {
          userID_rankingsID: {
            userID: userId,
            rankingsID: rankingsId,
          },
        },
        data: {
          points: updatedPoints,
          ...(appropriateRank && { rankingsID: appropriateRank.id }),
        },
      });
    }
  }

  //Create a user match
  async createUserMatch(userId: number, matchId: number) {
    await this.prisma.userMatch.create({
      data: {
        userID: userId,
        matchID: matchId,
      },
    });
  }

  //Update counter of games played by user
  async updateUserGames(winnerId: number, loserId: number) {
    await this.prisma.user.update({
      where: { id: winnerId },
      data: { nbGames: { increment: 1 } },
    });
    await this.prisma.user.update({
      where: { id: loserId },
      data: { nbGames: { increment: 1 } },
    });
  }
}
