import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class GatewayService
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  handleConnection() {
    console.log('Client connected');
  }

  handleDisconnect() {
    console.log('Client disconnected');
  }

  emitMatches(matches: any[]) {
    // Vérifier si le serveur WebSocket est initialisé
    if (this.server) {
      // Émettre les correspondances via les websockets
      this.server.emit('matches', matches);
    } else {
      console.error('WebSocket server is not initialized');
    }
  }
}
