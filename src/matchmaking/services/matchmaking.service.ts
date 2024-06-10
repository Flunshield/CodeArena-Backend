// matchmaking.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ChatGateway } from './matchmaking.gateway';

@Injectable()
export class MatchmakingService {
  private queue: number[] = [];
  private rooms: {
    roomId: string;
    user1: number;
    user2: number;
    puzzleId: number;
  }[] = [];

  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    private prisma: PrismaClient,
    private chatGateway: ChatGateway,
  ) {}

  addToQueue(userId: number): void {
    if (!this.queue.includes(userId)) {
      this.queue.push(userId);
      this.logger.log(`User ${userId} joined the queue`);
      this.processQueue();
    } else {
      this.logger.log(`User ${userId} is already in the queue`);
    }
  }

  async processQueue(): Promise<void> {
    for (const userId of this.queue) {
      if (this.isUserInRoom(userId)) {
        this.logger.log(`User ${userId} is already in a room`);
        continue;
      }
      const matchData = await this.findMatch(userId);
      if (matchData) {
        const { matchId, puzzleId } = matchData;
        const roomId = `room-${userId}-${matchId}`;
        this.rooms.push({
          roomId,
          user1: userId,
          user2: matchId,
          puzzleId: puzzleId,
        });
        this.chatGateway.notifyMatch(userId, matchId, roomId, puzzleId);
        this.logger.log(
          `User ${userId} and User ${matchId} matched in room ${roomId} with puzzle ${puzzleId}`,
        );
      }
    }
  }

  async getRandomPuzzle(rankingsId: number): Promise<number> {
    const puzzles = await this.prisma.puzzles.findMany({
      where: { rankingsID: rankingsId },
    });

    if (puzzles.length === 0) {
      this.logger.warn(`No puzzles found for ranking ID ${rankingsId}`);
      throw new Error('No puzzles found for the given ranking');
    }

    const randomIndex = Math.floor(Math.random() * puzzles.length);
    return puzzles[randomIndex].id;
  }

  async findMatch(
    userId: number,
  ): Promise<{ matchId: number; puzzleId: number } | undefined> {
    if (!this.queue.includes(userId)) {
      this.logger.log(`User ${userId} is not in the queue`);
      return undefined;
    }

    const userRanking = await this.getUserRanking(userId);
    if (userRanking === null) {
      this.logger.log(`User ${userId} has null ranking, cannot find match`);
      return undefined;
    }

    this.logger.log(`User ${userId} has ranking ${userRanking}`);

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
      const puzzleId = await this.getRandomPuzzle(userRanking);
      this.queue = this.queue.filter((u) => u !== userId && u !== match.userId);
      this.chatGateway.notifyMatch(
        userId,
        match.userId,
        `room-${userId}-${match.userId}`,
        puzzleId,
      );
      return { matchId: match.userId, puzzleId };
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
    this.logger.log(`User ${userId} left the queue`);
  }

  async getUserRanking(userId: number): Promise<number | null> {
    if (!userId) {
      this.logger.error('User ID is not defined');
      return null;
    }

    try {
      const userRanking = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { userRanking: { select: { rankingsID: true } } },
      });
      if (!userRanking || !userRanking.userRanking.length) {
        this.logger.warn(`No ranking found for user ID ${userId}`);
        return null;
      }
      return userRanking.userRanking[0].rankingsID;
    } catch (error) {
      this.logger.error('Error fetching user ranking:', error);
      return null;
    }
  }

  leaveRoom(userId: number): boolean {
    const roomIndex = this.rooms.findIndex(
      (room) => room.user1 === userId || room.user2 === userId,
    );
    if (roomIndex === -1) {
      return false;
    }

    const room = this.rooms[roomIndex];
    const otherUserId = room.user1 === userId ? room.user2 : room.user1;
    this.rooms.splice(roomIndex, 1);
    this.chatGateway.notifyUserLeft(room.roomId, userId);

    if (this.isUserInRoom(otherUserId)) {
      this.chatGateway.notifyUserAlone(otherUserId, room.roomId);
    }

    return true;
  }
}
