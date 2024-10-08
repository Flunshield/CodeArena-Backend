import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '../services/matchmaking.gateway';
import { AddMessageDto } from '../../interfaces/matchmaking';
import { Server, Socket } from 'socket.io';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let server: Server;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGateway],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as Server;

    gateway.server = server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleMessage', () => {
    it('should handle a message and emit it to the room', () => {
      const client = { id: 'client1' } as Socket;
      const payload: AddMessageDto = {
        userId: 1,
        roomId: 'room1',
        body: 'Hello World',
        username: 'user1',
        timestamp: Date.now(),
      };

      gateway.handleMessage(client, payload);

      expect(server.to).toHaveBeenCalledWith('room1');
      expect(server.emit).toHaveBeenCalledWith('message', payload);
    });
  });

  describe('joinRoom', () => {
    it('should allow a client to join a room', () => {
      const client = { id: 'client1', join: jest.fn() } as unknown as Socket;
      const roomId = 'room1';

      gateway.joinRoom(client, roomId);

      expect(client.join).toHaveBeenCalledWith(roomId);
    });
  });

  describe('leaveRoom', () => {
    it('should allow a client to leave a room', () => {
      const client = { id: 'client1', leave: jest.fn() } as unknown as Socket;
      const roomId = 'room1';

      gateway.leaveRoom(client, roomId);

      expect(client.leave).toHaveBeenCalledWith(roomId);
    });
  });

  describe('notifyMatch', () => {
    it('should notify clients of a match', () => {
      const userId1 = 1;
      const userId2 = 2;
      const roomId = 'room1';

      gateway.notifyMatch(userId1, userId2, roomId);

      expect(server.emit).toHaveBeenCalledWith('matchFound', {
        userId1,
        userId2,
        roomId,
      });
    });
  });

  describe('notifyUserLeft', () => {
    it('should notify the room when a user leaves', () => {
      const roomId = 'room1';
      const userId = 1;

      gateway.notifyUserLeft(roomId, userId);

      expect(server.to).toHaveBeenCalledWith(roomId);
      expect(server.emit).toHaveBeenCalledWith('userLeft', { userId });
    });
  });

  describe('notifyUserAlone', () => {
    it('should notify the user when they are alone in the room', () => {
      const userId = 1;
      const roomId = 'room1';

      gateway.notifyUserAlone(userId, roomId);

      expect(server.to).toHaveBeenCalledWith(roomId);
      expect(server.emit).toHaveBeenCalledWith('userAlone', { userId });
    });
  });

  describe('afterInit', () => {
    it('should log "Init" after initialization', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.afterInit();

      expect(loggerSpy).toHaveBeenCalledWith('Init');
    });
  });

  describe('handleConnection', () => {
    it('should log when a client connects', () => {
      const client = { id: 'client1' } as Socket;
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleConnection(client);

      expect(loggerSpy).toHaveBeenCalledWith('Client connected: client1');
    });
  });

  describe('handleDisconnect', () => {
    it('should log when a client disconnects', () => {
      const client = { id: 'client1' } as Socket;
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleDisconnect(client);

      expect(loggerSpy).toHaveBeenCalledWith('Client disconnected: client1');
    });
  });
});
