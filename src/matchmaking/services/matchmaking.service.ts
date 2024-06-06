import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ChatGateway } from './matchmaking.gateway';

@Injectable()
export class MatchmakingService {
  private queue: number[] = [];
  private rooms: { roomId: string; user1: number; user2: number }[] = [];

  constructor(
    private prisma: PrismaClient,
    private chatGateway: ChatGateway,
  ) {}

  addToQueue(userId: number): void {
    if (!this.queue.includes(userId)) {
      this.queue.push(userId);
      console.log(`User ${userId} joined the queue`);
      this.processQueue();
    } else {
      console.log(`User ${userId} is already in the queue`);
    }
  }

  async processQueue() {
    for (const userId of this.queue) {
      if (this.isUserInRoom(userId)) {
        console.log(`User ${userId} is already in a room`);
        continue;
      }
      const match = await this.findMatch(userId);
      if (match) {
        const roomId = `room-${userId}-${match}`;
        this.rooms.push({ roomId, user1: userId, user2: match });
        this.chatGateway.notifyMatch(userId, match, roomId);
        console.log(
          `User ${userId} and User ${match} matched in room ${roomId}`,
        );
      }
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
        .filter(
          (otherUserId) =>
            otherUserId !== userId && !this.isUserInRoom(otherUserId),
        )
        .map(async (otherUserId) => {
          const ranking = await this.getUserRanking(otherUserId);
          return { userId: otherUserId, ranking };
        }),
    );

    const match = matches.find((match) => match.ranking === userRanking);

    if (match) {
      this.queue = this.queue.filter((u) => u !== userId && u !== match.userId);
      this.chatGateway.notifyMatch(
        userId,
        match.userId,
        `room-${userId}-${match.userId}`,
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

  getRooms() {
    return this.rooms;
  }

  isUserInRoom(userId: number): boolean {
    return this.rooms.some(
      (room) => room.user1 === userId || room.user2 === userId,
    );
  }

  removeFromQueue(userId: number): void {
    this.queue = this.queue.filter((id) => id !== userId);
    console.log(`User ${userId} left the queue`);
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
