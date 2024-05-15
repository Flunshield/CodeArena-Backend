import { Controller, Post, Body, Get } from '@nestjs/common';
import { MatchmakingService } from '../services/matchmaking.service';

@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  // Endpoint pour ajouter un utilisateur à la file d'attente
  @Post('joinQueue')
  async joinQueue(@Body() userId: { id: number }) {
    console.log('Received userId:', userId); //TODO : log
    // Ajouter l'utilisateur à la file d'attente en utilisant le service
    this.matchmakingService.addToQueue(userId.id);
    return { message: 'Join queue request received' }; // Une réponse de confirmation par exemple
  }

  // Endpoint pour trouver un match pour un utilisateur
  @Post('findMatch')
  async findMatch(@Body() userId: { id: number }) {
    // Vérifie si l'utilisateur est dans la file d'attente
    const isInQueue = await this.matchmakingService.isUserInQueue(userId.id);

    if (!isInQueue) {
      console.log(`User ${userId.id} is not in the queue`); //TODO : log
      return { message: 'You are not in the queue' }; // Message si l'utilisateur n'est pas dans la file d'attente
    }

    // Envoie seulement l'ID de l'utilisateur au service
    const match = await this.matchmakingService.findMatch(userId.id);
    if (match !== undefined && match !== userId.id) {
      return match;
    } else if (match === userId.id) {
      return { message: 'You cannot match with yourself' };
    } else {
      return { message: 'No match found' };
    }
  }

  // Endpoint pour obtenir la liste des utilisateurs dans la file d'attente
  @Get('queue')
  getQueue() {
    return this.matchmakingService.getQueue();
  }
}
