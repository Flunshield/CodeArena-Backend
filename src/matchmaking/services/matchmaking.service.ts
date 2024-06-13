import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ChatGateway } from './matchmaking.gateway';
import { QueueService } from './queue.service';
import { RoomService } from './room.service';
import { CreateRoomDto } from '../../dto/matchmaking';

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly chatGateway: ChatGateway,
    private readonly queueService: QueueService,
    private readonly roomService: RoomService,
  ) {}

  addToQueue(userId: number): void {
    if (!this.isValidUserId(userId)) {
      this.logger.log(`Invalid userId: ${userId}`);
      return;
    }
    this.queueService.addUser(userId);
    this.logger.log(`User ${userId} joined the queue`);
    this.processQueue();
  }

  async processQueue(): Promise<void> {
    const queue = this.queueService.getQueue();
    for (const userId of queue) {
      if (this.roomService.isUserInRoom(userId)) {
        this.logger.log(`User ${userId} is already in a room`);
        continue;
      }

      const matchData = await this.findMatch(userId);
      if (matchData) {
        this.roomService.createRoomAndNotify(userId, matchData);
      }
    }
  }

  async findMatch(userId: number): Promise<CreateRoomDto | undefined> {
    if (!this.queueService.isUserInQueue(userId)) {
      this.logger.log(`User ${userId} is not in the queue`);
      return undefined;
    }

    const userRanking = await this.getUserRanking(userId);
    if (userRanking === null) {
      this.logger.log(`User ${userId} has null ranking, cannot find match`);
      return undefined;
    }

    this.logger.log(`User ${userId} has ranking ${userRanking}`);

    const match = await this.findMatchingUser(userId, userRanking);
    if (match) {
      const puzzleId = await this.getRandomPuzzle(userRanking);
      this.queueService.removeUser(userId);
      this.queueService.removeUser(match.userId);
      return {
        firstUser: match.userId,
        puzzleId,
        startTimestamp: Date.now(),
      };
    }

    return undefined;
  }

  private async findMatchingUser(
    userId: number,
    userRanking: number,
  ): Promise<{ userId: number; ranking: number } | undefined> {
    const matches = await Promise.all(
      this.queueService
        .getQueue()
        .filter(
          (otherUserId) =>
            otherUserId !== userId &&
            !this.roomService.isUserInRoom(otherUserId),
        )
        .map(async (otherUserId) => {
          const ranking = await this.getUserRanking(otherUserId);
          return { userId: otherUserId, ranking };
        }),
    );

    return matches.find((match) => match.ranking === userRanking);
  }

  isValidUserId(userId: number): boolean {
    return Number.isInteger(userId) && userId > 0;
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
}
