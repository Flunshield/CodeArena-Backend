import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ChatGateway } from './matchmaking.gateway';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MatchmakingService {
  private queue: number[] = [];
  private rooms: {
    roomId: string;
    user1: number;
    user2: number;
    puzzleId: number;
    startTimestamp: number;
  }[] = [];

  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    private prisma: PrismaClient,
    private chatGateway: ChatGateway,
  ) {}

  /*
   ****************************
   * Queue Management Methods *
   ****************************
   */
  addToQueue(userId: number): void {
    if (!this.isValidUserId(userId)) {
      this.logger.log(`Invalid userId: ${userId}`);
      return;
    }
    if (!this.queue.includes(userId)) {
      this.queue.push(userId);
      this.logger.log(`User ${userId} joined the queue`);
      this.processQueue();
    } else {
      this.logger.log(`User ${userId} is already in the queue`);
    }
  }

  removeFromQueue(userId: number): void {
    this.queue = this.queue.filter((id) => id !== userId);
    this.logger.log(`User ${userId} left the queue`);
  }

  isUserInQueue(userId: number): boolean {
    return this.queue.includes(userId);
  }

  getQueue(): number[] {
    return this.queue;
  }

  /*
   ***************************
   * Room Management Methods *
   ***************************
   */
  isUserInRoom(userId: number): boolean {
    return this.rooms.some(
      (room) => room.user1 === userId || room.user2 === userId,
    );
  }

  getRoomIdByUserId(userId: number): string | null {
    const room = this.rooms.find(
      (room) => room.user1 === userId || room.user2 === userId,
    );
    return room ? room.roomId : null;
  }

  getRooms() {
    return this.rooms;
  }

  leaveRoom(userId: number): boolean {
    const roomIndex = this.rooms.findIndex(
      (room) => room.user1 === userId || room.user2 === userId,
    );
    if (roomIndex === -1) {
      return false;
    }
    const room = this.rooms[roomIndex];
    let winnerId: number | null = null;

    if (room.user1 === userId) {
      winnerId = room.user2;
      room.user1 = null;
    } else {
      winnerId = room.user1;
      room.user2 = null;
    }

    this.chatGateway.notifyUserLeft(room.roomId, userId);

    if (winnerId !== null) {
      const matchDuration = (Date.now() - room.startTimestamp) / 1000;
      this.endMatch(
        room.roomId,
        userId,
        winnerId,
        matchDuration,
        room.startTimestamp,
      );
      console.log('matchDuration', matchDuration); //TODO: Remove this line
    }

    if (room.user1 === null || room.user2 === null) {
      this.rooms.splice(roomIndex, 1);
    }

    return true;
  }

  async endMatch(
    roomId: string,
    loserId: number,
    winnerId: number,
    matchDuration: number,
    startTimestamp: number,
  ): Promise<void> {
    const points = this.calculatePoints(matchDuration, '0-0');
    const startDate = startTimestamp.toString();
    const winnerRankingsId = await this.getUserRanking(winnerId);
    const loserRankingsId = await this.getUserRanking(loserId);

    const match = await this.prisma.matches.create({
      data: {
        date: startDate,
        time: matchDuration.toString(),
        location: roomId,
        status: 'Completed',
        score: '0-0',
        tournamentID: null,
        rankingsID: 1,
        eventsID: null,
        winnerId: winnerId,
        winnerPoints: points.winnerPoints,
        loserId: loserId,
        loserPoints: points.loserPoints,
      },
    });

    await this.prisma.userRanking.update({
      where: {
        userID_rankingsID: { userID: winnerId, rankingsID: winnerRankingsId },
      },
      data: { points: { increment: points.winnerPoints } },
    });

    await this.prisma.userRanking.update({
      where: {
        userID_rankingsID: { userID: loserId, rankingsID: loserRankingsId },
      },
      data: { points: { increment: points.loserPoints } },
    });

    await this.prisma.userMatch.create({
      data: {
        userID: winnerId,
        matchID: match.id,
      },
    });
    await this.prisma.userMatch.create({
      data: {
        userID: loserId,
        matchID: match.id,
      },
    });
  }

  calculatePoints(
    matchDuration: number,
    finalScore: string,
  ): { winnerPoints: number; loserPoints: number } {
    const [winnerScore, loserScore] = finalScore.split('-').map(Number);

    let winnerPoints = 10; // Points de base pour le gagnant
    let loserPoints = 0; // Points de base pour le perdant

    // Ajustement des points en fonction de la durée du match (exemple)
    if (matchDuration < 1) {
      // Si le match a duré moins d'une minute
      winnerPoints = 0;
      loserPoints = -10;
    } else if (matchDuration < 5) {
      // Si le match a duré moins de 5 minutes
      winnerPoints += 5;
      loserPoints += 0;
    } else if (matchDuration >= 5 && matchDuration <= 10) {
      // Si le match a duré entre 5 et 10 minutes
      winnerPoints += 3;
      loserPoints += 0;
    }
    // Ajustement des points en fonction de l'écart de score, seulement si le match a duré plus d'une minute
    if (matchDuration >= 1) {
      const scoreDifference = Math.abs(winnerScore - loserScore);
      if (scoreDifference <= 2) {
        // Match serré
        winnerPoints += 2;
        loserPoints += 2;
      } else if (scoreDifference > 2 && scoreDifference <= 5) {
        // Match avec un écart modéré
        winnerPoints += 1;
        loserPoints += 0;
      }
    }
    return { winnerPoints, loserPoints };
  }

  /*
   ***********************************
   * Matching and Processing Methods *
   ***********************************
   */
  async processQueue(): Promise<void> {
    for (const userId of this.queue) {
      if (this.isUserInRoom(userId)) {
        this.logger.log(`User ${userId} is already in a room`);
        continue;
      }

      const matchData = await this.findMatch(userId);
      if (matchData) {
        this.createRoomAndNotify(
          userId,
          matchData.firstUser,
          matchData.puzzleId,
          matchData.startTimestamp,
        );
      }
    }
  }

  async findMatch(
    userId: number,
  ): Promise<
    { firstUser: number; puzzleId: number; startTimestamp: number } | undefined
  > {
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

    const match = await this.findMatchingUser(userId, userRanking);
    if (match) {
      const puzzleId = await this.getRandomPuzzle(userRanking);
      this.queue = this.queue.filter((u) => u !== userId && u !== match.userId);
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

    return matches.find((match) => match.ranking === userRanking);
  }

  private createRoomAndNotify(
    user1: number,
    user2: number,
    puzzleId: number,
    startTimestamp: number,
  ): void {
    const roomId = uuidv4();
    this.rooms.push({
      roomId,
      user1,
      user2,
      puzzleId,
      startTimestamp,
    });

    this.chatGateway.notifyMatch(
      user1,
      user2,
      roomId,
      puzzleId,
      startTimestamp,
    );
  }

  /*
   *****************************
   * Puzzle Management Methods *
   *****************************
   */
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

  /*
   *******************
   * Utility Methods *
   *******************
   */
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
}
