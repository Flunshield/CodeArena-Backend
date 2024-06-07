// matchmaking.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { MatchmakingService } from '../services/matchmaking.service';
import {
  JoinQueueDto,
  LeaveQueueDto,
  LeaveRoomDto,
} from '../../dto/matchmaking';
@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('joinQueue')
  async joinQueue(@Body() joinQueueDto: { data: JoinQueueDto }) {
    const userId = joinQueueDto.data.id;
    const isInQueue = await this.matchmakingService.isUserInQueue(userId);
    const isInRoom = this.matchmakingService.isUserInRoom(userId);

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

  @Get('getQueue')
  getQueue() {
    const queue = this.matchmakingService.getQueue();
    return { success: true, queue };
  }

  @Get('getRooms')
  getRooms() {
    const rooms = this.matchmakingService.getRooms();
    return { success: true, rooms };
  }

  @Post('leaveQueue')
  async leaveQueue(@Body() leaveQueueDto: { data: LeaveQueueDto }) {
    const userId = leaveQueueDto.data.id;
    const isInQueue = await this.matchmakingService.isUserInQueue(userId);

    if (!isInQueue) {
      return { success: false, message: 'You are not in the queue.' };
    }

    this.matchmakingService.removeFromQueue(userId);
    return {
      success: true,
      message: 'You have successfully left the queue.',
    };
  }

  @Post('leaveRoom')
  async leaveRoom(@Body() leaveRoomDto: { data: LeaveRoomDto }) {
    const userId = leaveRoomDto.data.id;
    const leftRoom = this.matchmakingService.leaveRoom(userId);

    if (!leftRoom) {
      return { success: false, message: 'You are not in any room.' };
    }

    return {
      success: true,
      message: 'You have successfully left the room.',
    };
  }
}
