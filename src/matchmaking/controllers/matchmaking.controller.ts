// matchmaking.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { MatchmakingService } from '../services/matchmaking.service';

@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('joinQueue')
  async joinQueue(@Body() requestData: { data: { id: number } }) {
    try {
      const userId = requestData.data.id;
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
    } catch (error) {
      throw new HttpException(
        `Failed to join queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('getQueue')
  getQueue() {
    try {
      const queue = this.matchmakingService.getQueue();
      return { success: true, queue };
    } catch (error) {
      throw new HttpException(
        `Failed to get queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('getRooms')
  getRooms() {
    try {
      const rooms = this.matchmakingService.getRooms();
      return { success: true, rooms };
    } catch (error) {
      throw new HttpException(
        `Failed to get rooms: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('leaveQueue')
  async leaveQueue(@Body() requestData: { data: { id: number } }) {
    try {
      const userId = requestData.data.id;
      const isInQueue = await this.matchmakingService.isUserInQueue(userId);

      if (!isInQueue) {
        return { success: false, message: 'You are not in the queue.' };
      }

      this.matchmakingService.removeFromQueue(userId);
      return {
        success: true,
        message: 'You have successfully left the queue.',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to leave queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('leaveRoom')
  async leaveRoom(@Body() requestData: { data: { id: number } }) {
    try {
      const userId = requestData.data.id;
      const leftRoom = this.matchmakingService.leaveRoom(userId);

      if (!leftRoom) {
        return { success: false, message: 'You are not in any room.' };
      }

      return {
        success: true,
        message: 'You have successfully left the room.',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to leave room: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
