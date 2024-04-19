import { Injectable } from '@nestjs/common';

@Injectable()
export class WebsocketService {
  sendMessage(): string {
    return 'Hello, World!';
  }
}
