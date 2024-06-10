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
import { AddMessageDto } from '../../interfaces/matchmaking';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  /*
   ****************************
   * WebSocket Event Handlers *
   ****************************
   */
  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: AddMessageDto): void {
    this.logger.log(`Message from ${payload.userId}: ${payload.body}`);
    this.server.to(payload.roomId).emit('message', payload);
  }

  @SubscribeMessage('joinRoom')
  joinRoom(client: Socket, roomId: string): void {
    client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  leaveRoom(client: Socket, roomId: string): void {
    client.leave(roomId);
    this.logger.log(`Client ${client.id} left room ${roomId}`);
  }

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

  /*
   ************************
   * Notification Methods *
   ************************
   */
  notifyMatch(
    userId1: number,
    userId2: number,
    roomId: string,
    puzzleId: number,
  ): void {
    this.server.emit('matchFound', { userId1, userId2, roomId, puzzleId });
    this.logger.log(
      `Match found: User ${userId1} and User ${userId2} in room ${roomId} with puzzle ${puzzleId}`,
    );
  }

  notifyUserLeft(roomId: string, userId: number): void {
    this.server.to(roomId).emit('userLeft', { userId });
    this.logger.log(`User ${userId} left room ${roomId}`);
  }

  notifyUserAlone(userId: number, roomId: string): void {
    this.server.to(roomId).emit('userAlone', { userId });
    this.logger.log(`User ${userId} is alone in room ${roomId}`);
  }

  /*
   ****************************
   * Lifecycle Event Handlers *
   ****************************
   */
  afterInit(): void {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
