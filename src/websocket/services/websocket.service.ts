// matchmaking.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserRanking } from '../../interfaces/userInterface';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketService {
  @WebSocketServer() server: Server;

  constructor(private readonly prisma: PrismaClient) {}

  async findMatchesForPlayer(playerId: number): Promise<UserRanking[]> {
    // Récupérer le classement du joueur actuel
    const currentPlayerRanking = await this.prisma.userRanking.findUnique({
      where: { id: playerId },
    });

    if (!currentPlayerRanking) {
      throw new Error('Player ranking not found');
    }

    // Récupérer les joueurs avec le même rankingsID, exclure le joueur actuel
    const potentialMatches = await this.prisma.userRanking.findMany({
      where: {
        rankingsID: currentPlayerRanking.rankingsID,
        NOT: { id: playerId },
      },
    });

    // Émettre les correspondances via les websockets
    this.server.emit('matches', potentialMatches);

    return potentialMatches as UserRanking[];
  }
}
