import { Module } from '@nestjs/common';
import { WebsocketService } from './services/websocket.service';
import { WebSocketController } from './controllers/websocket.controller';

@Module({
  providers: [WebsocketService],
  controllers: [WebSocketController],
})
export class WebsocketModule {}
