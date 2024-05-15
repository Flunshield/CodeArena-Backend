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
  async joinQueue(@Body() userId: { id: number }) {
    try {
      const isInQueue = await this.matchmakingService.isUserInQueue(userId.id);

      if (isInQueue) {
        return {
          success: false,
          message: 'You are already in the queue.',
        };
      }

      this.matchmakingService.addToQueue(userId.id);
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

  @Post('findMatch')
  async findMatch(@Body() userId: { id: number }) {
    try {
      const isInQueue = await this.matchmakingService.isUserInQueue(userId.id);

      if (!isInQueue) {
        throw new HttpException(
          'You’re not in the queue.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const match = await this.matchmakingService.findMatch(userId.id);
      if (match !== undefined && match !== userId.id) {
        return {
          success: true,
          userIdMatched: match,
          message: 'You found a match.',
        };
      } else if (match === userId.id) {
        throw new HttpException(
          'You cannot associate with yourself.',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException('No matches found.', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      throw new HttpException(
        `Failed to find a match: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('queue')
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
}
