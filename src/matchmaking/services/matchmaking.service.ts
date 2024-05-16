import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class MatchmakingService {
  private queue: number[] = [];

  constructor(private prisma: PrismaClient) {}

  // Ajouter un utilisateur à la file d'attente
  addToQueue(userId: number): void {
    if (!this.queue.includes(userId)) {
      this.queue.push(userId);
      console.log(`User ${userId} joined the queue`); //TODO : log
    } else {
      console.log(`User ${userId} is already in the queue`); //TODO : log
    }
  }

  // Trouver un match pour un utilisateur dans la file d'attente
  async findMatch(userId: number): Promise<number | undefined> {
    if (!this.queue.includes(userId)) {
      console.log(`User ${userId} is not in the queue`); //TODO : log
      return undefined;
    }

    const userRanking = await this.getUserRanking(userId);

    if (userRanking === null) {
      console.log(`User ${userId} has null ranking, cannot find match`); //TODO : log
      return undefined;
    }

    console.log(`User ${userId} has ranking ${userRanking}`); //TODO : log

    const matches = await Promise.all(
      this.queue
        .filter((otherUserId) => otherUserId !== userId)
        .map(async (otherUserId) => {
          const ranking = await this.getUserRanking(otherUserId);
          return { userId: otherUserId, ranking };
        }),
    );

    const match = matches.find((match) => match.ranking === userRanking);

    if (match) {
      // Remove users from the queue
      this.queue = this.queue.filter((u) => u !== userId && u !== match.userId);
      console.log(`User ${userId} and User ${match.userId} matched`); //TODO : log
      return match.userId;
    }

    return undefined;
  }

  isUserInQueue(userId: number): boolean {
    return this.queue.includes(userId);
  }

  // Obtenir la liste des utilisateurs dans la file d'attente
  getQueue(): number[] {
    return this.queue;
  }

  removeFromQueue(userId: number): void {
    this.queue = this.queue.filter((id) => id !== userId);
    console.log(`User ${userId} left the queue`); //TODO : log
  }

  async getUserRanking(userId: number): Promise<number | null> {
    try {
      const userRanking = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          userRanking: {
            select: {
              rankingsID: true,
            },
          },
        },
      });
      return userRanking?.userRanking[0]?.rankingsID || null;
    } catch (error) {
      console.error('Error fetching user ranking:', error);
      return null;
    }
  }
}
