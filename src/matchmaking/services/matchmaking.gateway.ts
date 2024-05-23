// chat.gateway.ts
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AddMessageDto } from '../../dto/message';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server;

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: AddMessageDto): void {
    console.log(payload);
    this.server.to(payload.roomId).emit('message', payload);
  }

  joinRoom(client: Socket, roomId: string): void {
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);
  }

  notifyMatch(userId1: number, userId2: number, roomId: string): void {
    this.server.to(roomId).emit('match', { userId1, userId2, roomId });
  }
}
