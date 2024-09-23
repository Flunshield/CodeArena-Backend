import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { RoomService } from './room.service';
import { AddMessageDto } from '../../interfaces/matchmaking';

@WebSocketGateway({
  cors: {
    origin: process.env.URL_FRONT,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly roomService: RoomService) {}

  /*
   ****************************
   * WebSocket Event Handlers *
   ****************************
   */

  // Gestion des messages
  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: AddMessageDto): void {
    this.logger.log(`Message from ${payload.userId}: ${payload.body}`);
    this.server.to(payload.roomId).emit('message', payload);
  }

  // Gestion de la jonction des salles
  @SubscribeMessage('joinRoom')
  joinRoom(client: Socket, roomId: string): void {
    client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
  }

  // Gestion de l'événement "typing"
  @SubscribeMessage('typing')
  handleTyping(
    client: Socket,
    payload: {
      roomId: string;
      isTyping: boolean;
      userId: number;
      username: string;
    },
  ): void {
    this.logger.log(
      `User ${payload.userId} is typing in room ${payload.roomId}`,
    );
    this.server.to(payload.roomId).emit('typing', payload);
  }

  // Gestion de la fin de match par le gagnant
  @SubscribeMessage('endMatchByWinner')
  handleEndMatchByWinner(
    client: Socket,
    payload: { userId: number; roomId: string },
  ): void {
    this.logger.log(
      `Match ended by winner in room ${payload.roomId} with winner ID ${payload.userId}`,
    );

    // Vérifiez que le client est bien dans la salle
    const clientsInRoom = this.server.sockets.adapter.rooms.get(payload.roomId);
    if (!clientsInRoom || !clientsInRoom.has(client.id)) {
      this.logger.warn(
        `Client ${client.id} not in room ${payload.roomId}, forcing join.`,
      );
      client.join(payload.roomId);
    }

    // Émettre l'événement de fin de match à tous les clients dans la salle
    this.server.to(payload.roomId).emit('endMatchByWinner', {
      success: true,
      roomId: payload.roomId,
      userId: payload.userId,
      message: 'Match successfully ended.',
    });

    // Déconnecter les autres clients dans la salle
    clientsInRoom?.forEach((socketId) => {
      if (socketId !== client.id) {
        const opponentSocket = this.server.sockets.sockets.get(socketId);
        if (opponentSocket) {
          opponentSocket.leave(payload.roomId);
          opponentSocket.emit('endMatchByWinner', {
            roomId: payload.roomId,
            message: 'The match has ended, you have been disconnected.',
          });
          opponentSocket.disconnect();
          this.logger.log(
            `Client ${opponentSocket.id} disconnected from room ${payload.roomId}`,
          );
        }
      }
    });

    this.roomService.endRoomByWinner(payload.roomId, payload.userId);
  }

  /*
   ************************
   * Notification Methods *
   ************************
   */

  // Notification de match trouvé
  notifyMatch(
    userId1: number,
    userId2: number,
    roomId: string,
    puzzle: object,
    startTimestamp: number,
  ): void {
    this.server.emit('matchFound', {
      userId1,
      userId2,
      roomId,
      puzzle,
      startTimestamp,
    });
    this.logger.log(
      `Match found: User ${userId1} and User ${userId2} in room ${roomId} with puzzle ${puzzle}`,
    );
  }

  // Notification qu'un utilisateur a quitté la salle
  notifyUserLeft(roomId: string, userId: number): void {
    this.server.to(roomId).emit('userLeft', { userId });
    this.logger.log(`User ${userId} left room ${roomId}`);
  }

  /*
   ****************************
   * Lifecycle Event Handlers *
   ****************************
   */

  // Initialisation du Gateway
  afterInit(): void {
    this.logger.log('WebSocket Gateway Initialized');
  }

  // Gestion de la connexion d'un client
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // Gestion de la déconnexion d'un client
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
