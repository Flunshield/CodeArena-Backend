// matchmaking.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ChatGateway } from './matchmaking.gateway';

@Injectable()
export class MatchmakingService {
  private queue: number[] = [];

  constructor(
    private prisma: PrismaClient,
    private chatGateway: ChatGateway,
  ) {}

  addToQueue(userId: number): void {
    if (!this.queue.includes(userId)) {
      this.queue.push(userId);
      console.log(`User ${userId} joined the queue`);
    } else {
      console.log(`User ${userId} is already in the queue`);
    }
  }

  async findMatch(userId: number): Promise<number | undefined> {
    if (!this.queue.includes(userId)) {
      console.log(`User ${userId} is not in the queue`);
      return undefined;
    }

    const userRanking = await this.getUserRanking(userId);

    if (userRanking === null) {
      console.log(`User ${userId} has null ranking, cannot find match`);
      return undefined;
    }

    console.log(`User ${userId} has ranking ${userRanking}`);

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
      this.queue = this.queue.filter((u) => u !== userId && u !== match.userId);

      const roomId = `room-${userId}-${match.userId}`;
      this.chatGateway.notifyMatch(userId, match.userId, roomId);
      console.log(
        `User ${userId} and User ${match.userId} matched in room ${roomId}`,
      );

      return match.userId;
    }

    return undefined;
  }

  isUserInQueue(userId: number): boolean {
    return this.queue.includes(userId);
  }

  getQueue(): number[] {
    return this.queue;
  }

  removeFromQueue(userId: number): void {
    this.queue = this.queue.filter((id) => id !== userId);
    console.log(`User ${userId} left the queue`);
  }

  async getUserRanking(userId: number): Promise<number | null> {
    try {
      const userRanking = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { userRanking: { select: { rankingsID: true } } },
      });
      return userRanking?.userRanking[0]?.rankingsID || null;
    } catch (error) {
      console.error('Error fetching user ranking:', error);
      return null;
    }
  }
}
