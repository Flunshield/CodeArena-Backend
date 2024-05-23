// chat.gateway.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './matchmaking.gateway';
import { AddMessageDto } from '../../dto/message';
import { Socket } from 'socket.io';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let mockServer: any;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGateway],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleMessage', () => {
    it('should emit message to the correct room', () => {
      const client: Socket = { id: 'client1' } as any;
      const payload: AddMessageDto = {
        userId: 1,
        username: 'user1',
        body: 'Hello',
        timestamp: Date.now(),
        roomId: 'room1',
      };

      gateway.handleMessage(client, payload);

      expect(mockServer.to).toHaveBeenCalledWith('room1');
      expect(mockServer.emit).toHaveBeenCalledWith('message', payload);
    });
  });

  describe('joinRoom', () => {
    it('should make the client join the specified room', () => {
      const client: Socket = {
        id: 'client1',
        join: jest.fn(),
      } as any;
      const roomId = 'room1';

      gateway.joinRoom(client, roomId);

      expect(client.join).toHaveBeenCalledWith(roomId);
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('notifyMatch', () => {
    it('should notify the users about the match', () => {
      const userId1 = 1;
      const userId2 = 2;
      const roomId = 'room1';

      gateway.notifyMatch(userId1, userId2, roomId);

      expect(mockServer.to).toHaveBeenCalledWith(roomId);
      expect(mockServer.emit).toHaveBeenCalledWith('match', {
        userId1,
        userId2,
        roomId,
      });
    });
  });
});
