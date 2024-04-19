import { Controller, Get } from '@nestjs/common';
import { WebsocketService } from '../services/websocket.service';

@Controller('websocket')
export class WebSocketController {
  constructor(private readonly websocketService: WebsocketService) {}

  @Get('/test')
  sendMessage() {
    this.websocketService.sendMessage();
    return 'Message sent';
  }
}
