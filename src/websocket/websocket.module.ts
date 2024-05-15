import { Module } from '@nestjs/common';
import { WebsocketService } from './services/websocket.service';
import { WebSocketController } from './controllers/websocket.controller';
import { PrismaClient } from '@prisma/client';
import { GatewayService } from './services/websocket.gateway';

@Module({
  providers: [WebsocketService, PrismaClient, GatewayService],
  controllers: [WebSocketController],
})
export class WebsocketModule {}
