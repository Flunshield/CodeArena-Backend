import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatGateway } from './matchmaking.gateway';
import { PrismaClient } from '@prisma/client';
import { CreateRoomDto } from '../../dto/matchmaking';
import { Room } from '../../interfaces/matchmaking';
import { PointsCalculator } from '../utils/points-calculator';

@Injectable()
export class RoomService {
  private rooms: Room[] = [];
  private readonly logger = new Logger(RoomService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly chatGateway: ChatGateway,
  ) {}

  /*
   **********************************
   * Room Creation and Notification *
   **********************************
   */
  createRoomAndNotify(user1: number, matchData: CreateRoomDto): void {
    const roomId = uuidv4();
    const room = {
      roomId,
      user1,
      user2: matchData.firstUser,
      puzzleId: matchData.puzzleId,
      startTimestamp: matchData.startTimestamp,
    };
    this.rooms.push(room);

    this.chatGateway.notifyMatch(
      user1,
      matchData.firstUser,
      roomId,
      matchData.puzzleId,
      matchData.startTimestamp,
    );
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
    }

    if (room.user1 === null || room.user2 === null) {
      this.rooms.splice(roomIndex, 1);
    }

    return true;
  }

  /*
   ************************
   * Match End Management *
   ************************
   */
  private async endMatch(
    roomId: string,
    loserId: number,
    winnerId: number,
    matchDuration: number,
    startTimestamp: number,
  ): Promise<void> {
    const points = PointsCalculator.calculatePoints(matchDuration, '0-0');
    const startDate = new Date(startTimestamp).toISOString();
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

  /*
   *******************
   * Utility Methods *
   *******************
   */
  private async getUserRanking(userId: number): Promise<number | null> {
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

  /*
   ****************************
   * Getters for Room Details *
   ****************************
   */
  getRooms() {
    return this.rooms;
  }

  getRoomIdByUserId(userId: number): string | null {
    const room = this.rooms.find(
      (room) => room.user1 === userId || room.user2 === userId,
    );
    return room ? room.roomId : null;
  }
}
