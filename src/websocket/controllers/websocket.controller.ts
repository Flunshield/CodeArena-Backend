import { Controller, Get, Param } from '@nestjs/common'; // Importer Param depuis @nestjs/common
import { UserRanking } from '../../interfaces/userInterface';
import { WebsocketService } from '../services/websocket.service';

@Controller('websocket')
export class WebSocketController {
  constructor(private readonly websocketService: WebsocketService) {}

  @Get(':userId')
  async findMatchesForPlayer(
    @Param('userId') userId: string,
  ): Promise<UserRanking[]> {
    const playerId = parseInt(userId); // Convertir l'ID utilisateur en nombre
    return this.websocketService.findMatchesForPlayer(playerId);
  }
}
