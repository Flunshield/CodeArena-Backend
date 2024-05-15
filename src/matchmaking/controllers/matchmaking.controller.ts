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

  // Endpoint pour ajouter un utilisateur à la file d'attente
  @Post('joinQueue')
  async joinQueue(@Body() userId: { id: number }) {
    console.log('Received userId:', userId); //TODO : log
    try {
      // Ajouter l'utilisateur à la file d'attente en utilisant le service
      this.matchmakingService.addToQueue(userId.id);
      return { message: 'Join queue request received' }; // Une réponse de confirmation par exemple
    } catch (error) {
      throw new HttpException(
        `Failed to join queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint pour trouver un match pour un utilisateur
  @Post('findMatch')
  async findMatch(@Body() userId: { id: number }) {
    try {
      // Vérifie si l'utilisateur est dans la file d'attente
      const isInQueue = await this.matchmakingService.isUserInQueue(userId.id);

      if (!isInQueue) {
        console.log(`User ${userId.id} is not in the queue`); //TODO : log
        throw new HttpException(
          'You are not in the queue',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Envoie seulement l'ID de l'utilisateur au service
      const match = await this.matchmakingService.findMatch(userId.id);
      if (match !== undefined && match !== userId.id) {
        return match;
      } else if (match === userId.id) {
        return { message: 'You cannot match with yourself' };
      } else {
        throw new HttpException('No match found', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      throw new HttpException(
        `Failed to find match: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint pour obtenir la liste des utilisateurs dans la file d'attente
  @Get('queue')
  getQueue() {
    try {
      return this.matchmakingService.getQueue();
    } catch (error) {
      throw new HttpException(
        `Failed to get queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
