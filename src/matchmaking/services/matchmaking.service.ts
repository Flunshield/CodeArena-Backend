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
      const matchDuration = (Date.now() - room.startTimestamp) / 1000 / 60;
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

  endMatch(
    roomId: string,
    loserId: number,
    winnerId: number,
    matchDuration: number,
    startTimestamp: number,
  ): void {
    const points = this.calculatePoints(matchDuration, '0-0');
    this.prisma.matches
      .create({
        data: {
          date: startTimestamp.toString(),
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
      })
      .then(() => {
        this.logger.log(`Match record created for room ${roomId}`);
      })
      .catch((err) => {
        this.logger.error(`Error creating match record: ${err.message}`);
      });
  }

  calculatePoints(
    matchDuration: number,
    finalScore: string,
  ): { winnerPoints: number; loserPoints: number } {
    const [winnerScore, loserScore] = finalScore.split('-').map(Number);

    let winnerPoints = 10; // Points de base pour le gagnant
    let loserPoints = 5; // Points de base pour le perdant

    // Ajustement des points en fonction de la durée du match (exemple)
    if (matchDuration < 1) {
      // Si le match a duré moins d'une minute
      winnerPoints = 0;
      loserPoints = -5;
    } else if (matchDuration < 5) {
      // Si le match a duré moins de 5 minutes
      winnerPoints += 5;
      loserPoints += 2;
    } else if (matchDuration >= 5 && matchDuration <= 10) {
      // Si le match a duré entre 5 et 10 minutes
      winnerPoints += 3;
      loserPoints += 1;
    }
    // Ajustement des points en fonction de l'écart de score (exemple)
    const scoreDifference = Math.abs(winnerScore - loserScore);
    if (scoreDifference <= 2) {
      // Match serré
      winnerPoints += 2;
      loserPoints += 2;
    } else if (scoreDifference > 2 && scoreDifference <= 5) {
      // Match avec un écart modéré
      winnerPoints += 1;
      loserPoints += 1;
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
        const { matchId, puzzleId, startTimestamp } = matchData;

        const roomId = uuidv4();
        this.rooms.push({
          roomId,
          user1: userId,
          user2: matchId,
          puzzleId: puzzleId,
          startTimestamp: startTimestamp,
        });
        this.chatGateway.notifyMatch(
          userId,
          matchId,
          roomId,
          puzzleId,
          startTimestamp,
        );
        this.logger.log(
          `User ${userId} and User ${matchId} matched in room ${roomId} with puzzle ${puzzleId}`,
        );
      }
    }
  }

  async findMatch(
    userId: number,
  ): Promise<
    { matchId: number; puzzleId: number; startTimestamp: number } | undefined
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
      const roomId = uuidv4();
      const startTimestamp = Date.now();
      this.chatGateway.notifyMatch(
        userId,
        match.userId,
        roomId,
        puzzleId,
        startTimestamp,
      );
      return {
        matchId: match.userId,
        puzzleId,
        startTimestamp,
      };
    }

    return undefined;
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
