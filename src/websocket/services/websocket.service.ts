import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserRanking } from '../../interfaces/userInterface';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketService {
  @WebSocketServer() server: Server;

  // Ensemble pour stocker les joueurs en attente de correspondance
  private waitingPlayers: Set<number> = new Set<number>();

  constructor(private readonly prisma: PrismaClient) {}

  async findMatchesForPlayer(playerId: number): Promise<UserRanking[]> {
    // Ajouter le joueur à la file d'attente
    this.waitingPlayers.add(playerId);

    // Si la file d'attente contient plus d'un joueur, effectuer un match
    if (this.waitingPlayers.size > 1) {
      // Convertir l'ensemble en tableau pour pouvoir retirer les joueurs de la file d'attente
      const playerIds = Array.from(this.waitingPlayers).splice(0, 2); // Récupérer les deux premiers joueurs

      // Retirer les joueurs de la file d'attente
      this.waitingPlayers.delete(playerIds[0]);
      this.waitingPlayers.delete(playerIds[1]);

      // Effectuer le match entre les deux joueurs
      await this.matchPlayers(playerIds[0], playerIds[1]);
    }

    // Renvoyer les correspondances du joueur (qui peut être vide si le joueur est en attente)
    return [];
  }

  // Méthode pour vérifier si un joueur est en file d'attente
  isPlayerInQueue(playerId: number): boolean {
    return this.waitingPlayers.has(playerId);
  }

  // Méthode pour mettre en correspondance deux joueurs
  private async matchPlayers(
    player1Id: number,
    player2Id: number,
  ): Promise<void> {
    // Vous pouvez mettre en œuvre votre logique de mise en correspondance ici
    // Par exemple, vous pouvez utiliser les IDs des joueurs pour rechercher leurs données de classement,
    // les comparer et générer une correspondance appropriée.
    // Une fois que la correspondance est établie, vous pouvez émettre les données de correspondance via les websockets
    const player1Ranking = await this.prisma.userRanking.findUnique({
      where: { id: player1Id },
    });
    const player2Ranking = await this.prisma.userRanking.findUnique({
      where: { id: player2Id },
    });

    // Émettre les correspondances via les websockets si le serveur est défini
    if (this.server) {
      this.server.emit('matches', [player1Ranking, player2Ranking]);
    } else {
      console.error('WebSocket server is not initialized');
    }
  }

  // Méthode pour obtenir tous les ID des joueurs en file d'attente
  getPlayersInQueue(): number[] {
    return Array.from(this.waitingPlayers);
  }
}
