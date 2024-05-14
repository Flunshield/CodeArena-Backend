import { Controller, Get, Param } from '@nestjs/common'; // Importer Param depuis @nestjs/common
import { UserRanking } from '../../interfaces/userInterface';
import { WebsocketService } from '../services/websocket.service';

@Controller('websocket')
export class WebSocketController {
  constructor(private readonly websocketService: WebsocketService) {}

  @Get(':userId')
  async getUserMatches(@Param('userId') userId: string): Promise<{
    alreadyInQueue: boolean;
    waitingPlayers: number[];
    matches: UserRanking[];
  }> {
    const playerId = parseInt(userId); // Convertir l'ID utilisateur en nombre

    // Vérifier si le joueur est déjà en file d'attente
    const isInQueue = this.websocketService.isPlayerInQueue(playerId);
    if (isInQueue) {
      // Le joueur est déjà en file d'attente, récupérer la liste des joueurs en file d'attente
      const waitingPlayers = this.websocketService.getPlayersInQueue();
      console.log(
        `Le joueur avec l'ID ${playerId} est déjà en file d'attente. Joueurs en file d'attente : ${waitingPlayers.join(
          ', ',
        )}`,
      );
      // Vous pouvez envoyer une réponse appropriée au client ou effectuer d'autres actions
      return { alreadyInQueue: true, waitingPlayers, matches: [] };
    }

    // Si le joueur n'est pas en file d'attente, ajoutez-le à la file d'attente
    const matches = await this.websocketService.findMatchesForPlayer(playerId);
    return { alreadyInQueue: false, waitingPlayers: [], matches };
  }
}
