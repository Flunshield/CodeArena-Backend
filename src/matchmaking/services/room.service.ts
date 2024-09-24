import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
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
    @Inject(forwardRef(() => ChatGateway))
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
      puzzle: matchData.puzzle,
      startTimestamp: matchData.startTimestamp,
    };
    this.rooms.push(room);

    this.chatGateway.notifyMatch(
      user1,
      matchData.firstUser,
      roomId,
      matchData.puzzle,
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
  getRoomPuzzle(roomId: string): object | null {
    const room = this.rooms.find((room) => room.roomId === roomId);
    return room ? room.puzzle : null;
  }

  getRoomStartTimestamp(roomId: string): number | null {
    const room = this.rooms.find((room) => room.roomId === roomId);
    return room ? room.startTimestamp : null;
  }

  leaveRoom(userId: number): boolean {
    const roomIndex = this.rooms.findIndex(
      (room) => room.user1 === userId || room.user2 === userId,
    );
    if (roomIndex === -1) return false;

    const room = this.rooms[roomIndex];
    const leavingUser = room.user1 === userId ? 'user1' : 'user2';
    const winnerId = leavingUser === 'user1' ? room.user2 : room.user1;

    room[leavingUser] = null;

    this.chatGateway.notifyUserLeft(room.roomId, userId);

    if (winnerId !== null) {
      this.handleMatchEnd(room, userId, winnerId, false, 'Abandon');
    }

    if (room.user1 === null || room.user2 === null) {
      this.rooms.splice(roomIndex, 1);
    }
    return true;
  }

  endRoomByTimer(roomId: string): boolean {
    const roomIndex = this.rooms.findIndex((room) => room.roomId === roomId);
    if (roomIndex === -1) return false;

    const room = this.rooms[roomIndex];
    this.handleMatchEnd(room, room.user1, room.user2, true, 'Temps écoulé');
    if (room.user1 === null || room.user2 === null) {
      this.rooms.splice(roomIndex, 1);
    }
    this.rooms.splice(roomIndex, 1);
    return true;
  }

  endRoomByWinner(roomId: string, winnerId: number): boolean {
    const roomIndex = this.rooms.findIndex((room) => room.roomId === roomId);
    if (roomIndex === -1) return false;

    const room = this.rooms[roomIndex];
    const loserId = room.user1 === winnerId ? room.user2 : room.user1;

    if (loserId !== null) {
      room.user1 === winnerId ? (room.user1 = null) : (room.user2 = null);
      this.handleMatchEnd(room, loserId, winnerId, false, 'Terminé');
    }
    this.rooms.splice(roomIndex, 1);
    return true;
  }

  private async handleMatchEnd(
    room: any,
    loserId: number,
    winnerId: number,
    egality: boolean,
    status: string,
  ): Promise<void> {
    const matchDuration = (Date.now() - room.startTimestamp) / 1000;
    this.endMatch(
      room.roomId,
      loserId,
      winnerId,
      matchDuration,
      room.startTimestamp,
      egality,
      status,
    );
    const user1 = await this.getUserName(winnerId);
    const user2 = await this.getUserName(loserId);
    const messageBody = egality
      ? `Match terminé avec une égalité!`
      : `Match terminé. ${user1.toUpperCase()} a gagné contre ${user2.toUpperCase()}.`;
    const payload = {
      userId: 0,
      username: 'System',
      body: messageBody,
      timestamp: Date.now(),
      roomId: room.roomId,
      end: true,
    };
    this.chatGateway.handleMessage(null, payload);
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
    egality: boolean,
    status: string,
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
        status: status,
        score: `(${points.winnerPoints}) / (${points.loserPoints})`,
        tournamentID: null,
        rankingsID: winnerRankingsId,
        eventsID: null,
        winnerId: winnerId,
        winnerPoints: points.winnerPoints,
        loserId: loserId,
        loserPoints: points.loserPoints,
        //egality: egality,
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

  private async getUserName(userId: number): Promise<string | null> {
    if (!userId) {
      this.logger.error('User ID is not defined');
      return null;
    }
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { userName: true },
      });
      if (!user) {
        this.logger.warn(`No user found for user ID ${userId}`);
        return null;
      }
      return user.userName;
    } catch (error) {
      this.logger.error('Error fetching user name:', error);
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
