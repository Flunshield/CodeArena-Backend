import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { MatchmakingService } from '../services/matchmaking.service';
import { QueueService } from '../services/queue.service';
import { RoomService } from '../services/room.service';
import {
  JoinQueueDto,
  LeaveQueueDto,
  LeaveRoomDto,
} from '../../dto/matchmaking';
@Controller('matchmaking')
export class MatchmakingController {
  constructor(
    private readonly matchmakingService: MatchmakingService,
    private readonly queueService: QueueService,
    private readonly roomService: RoomService,
  ) {}

  //TODO: add @Roles(USER) to all methods
  /*
   ******************************
   * Queue Management Endpoints *
   ******************************
   */
  @Post('joinQueue')
  async joinQueue(@Body() joinQueueDto: { data: JoinQueueDto }) {
    const userId = joinQueueDto.data.id;

    if (!this.matchmakingService.isValidUserId(userId)) {
      return { success: false, message: 'Invalid user ID.' };
    }

    const isInQueue = this.queueService.isUserInQueue(userId);
    const isInRoom = this.roomService.isUserInRoom(userId);

    if (isInQueue) {
      return { success: false, message: 'You are already in the queue.' };
    }

    if (isInRoom) {
      return { success: false, message: 'You are already in a room.' };
    }

    this.matchmakingService.addToQueue(userId);
    return {
      success: true,
      message: 'You have successfully joined the queue.',
    };
  }

  @Post('leaveQueue')
  async leaveQueue(@Body() leaveQueueDto: { data: LeaveQueueDto }) {
    const userId = leaveQueueDto.data.id;
    const isInQueue = this.queueService.isUserInQueue(userId);

    if (!isInQueue) {
      return { success: false, message: 'You are not in the queue.' };
    }

    this.queueService.removeUser(userId);
    return {
      success: true,
      message: 'You have successfully left the queue.',
    };
  }

  @Get('getQueue')
  getQueue() {
    const queue = this.queueService.getQueue();
    return { success: true, queue };
  }

  @Get('isInQueue')
  isUserInQueue(@Query('userId') userId: string) {
    if (!this.matchmakingService.isValidUserId(parseInt(userId))) {
      return { success: false, message: 'Invalid user ID.' };
    }
    const isInQueue = this.queueService.isUserInQueue(parseInt(userId));
    return { success: true, isInQueue };
  }

  /*
   *****************************
   * Room Management Endpoints *
   *****************************
   */
  @Post('leaveRoom')
  async leaveRoom(@Body() leaveRoomDto: { data: LeaveRoomDto }) {
    const userId = leaveRoomDto.data.id;
    const leftRoom = this.roomService.leaveRoom(userId);

    if (!leftRoom) {
      return { success: false, message: 'You are not in any room.' };
    }

    return {
      success: true,
      message: 'You have successfully left the room.',
    };
  }

  @Post('endMatchByTimer')
  async endMatchByTimer(@Body() data: { data: LeaveRoomDto }) {
    const userId = data.data.id;
    const roomId = this.roomService.getRoomIdByUserId(userId);

    if (!roomId) {
      return { success: false, message: 'Room not found.' };
    }

    this.roomService.endRoomByTimer(roomId);
    return { success: true, message: 'Match ended.' };
  }

  @Post('endMatchByWinner')
  async endMatchByWinner(@Body() data: { data: LeaveRoomDto }) {
    const userId = data.data.id;
    const roomId = this.roomService.getRoomIdByUserId(userId);

    if (!roomId) {
      return { success: false, message: 'Room not found.' };
    }

    this.roomService.endRoomByWinner(roomId, userId);
    return { success: true, message: 'Match ended.' };
  }

  @Get('getRooms')
  getRooms() {
    const rooms = this.roomService.getRooms();
    return { success: true, rooms };
  }

  @Get('isInRoom')
  isUserInRoom(@Query('userId') userId: string) {
    if (!this.matchmakingService.isValidUserId(parseInt(userId))) {
      return { success: false, message: 'Invalid user ID.' };
    }
    const isInRoom = this.roomService.isUserInRoom(parseInt(userId));
    const roomId = this.roomService.getRoomIdByUserId(parseInt(userId));
    const puzzle = this.roomService.getRoomPuzzle(roomId);
    const startTimestamp = this.roomService.getRoomStartTimestamp(roomId);
    return {
      success: true,
      isInRoom,
      puzzle: puzzle,
      startTimestamp: startTimestamp,
      roomId: isInRoom ? roomId : null,
    };
  }

  @Get('findPuzzleById')
  findPuzzleById(@Query('roomId') roomId: string) {
    const puzzle = this.roomService.getRoomPuzzle(roomId);
    return { success: true, puzzle };
  }
}
