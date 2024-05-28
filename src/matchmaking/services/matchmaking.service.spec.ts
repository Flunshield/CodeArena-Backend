import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingService } from './matchmaking.service';
import { UserService } from '../../services/user/user.service'; // Adjust the path as needed
import { ChatGateway } from './matchmaking.gateway';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let userService: DeepMockProxy<UserService>;
  let chatGateway: DeepMockProxy<ChatGateway>;

  beforeEach(async () => {
    userService = mockDeep<UserService>();
    chatGateway = mockDeep<ChatGateway>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
        { provide: UserService, useValue: userService },
        { provide: ChatGateway, useValue: chatGateway },
      ],
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToQueue', () => {
    it('should add a user to the queue if not already present', () => {
      const userId = 1;
      service.addToQueue(userId);
      expect(service.getQueue()).toContain(userId);
    });

    it('should not add a user to the queue if already present', () => {
      const userId = 1;
      service.addToQueue(userId);
      service.addToQueue(userId);
      expect(service.getQueue().length).toBe(1);
    });
  });

  describe('isUserInQueue', () => {
    it('should return true if user is in the queue', () => {
      const userId = 1;
      service.addToQueue(userId);
      expect(service.isUserInQueue(userId)).toBe(true);
    });

    it('should return false if user is not in the queue', () => {
      const userId = 1;
      expect(service.isUserInQueue(userId)).toBe(false);
    });
  });

  describe('getQueue', () => {
    it('should return the list of users in the queue', () => {
      const userId1 = 1;
      const userId2 = 2;
      service.addToQueue(userId1);
      service.addToQueue(userId2);
      expect(service.getQueue()).toEqual([userId1, userId2]);
    });
  });

  describe('removeFromQueue', () => {
    it('should remove a user from the queue', () => {
      const userId = 1;
      service.addToQueue(userId);
      service.removeFromQueue(userId);
      expect(service.getQueue()).not.toContain(userId);
    });
  });

  describe('findMatch', () => {
    it('should return undefined if user is not in the queue', async () => {
      const userId = 1;
      const result = await service.findMatch(userId);
      expect(result).toBeUndefined();
    });

    it('should return undefined if user has null ranking', async () => {
      const userId = 1;
      service.addToQueue(userId);
      userService.getUserRanked.mockResolvedValueOnce(null);

      const result = await service.findMatch(userId);
      expect(result).toBeUndefined();
    });

    it('should find a match and notify users', async () => {
      const userId1 = 1;
      const userId2 = 2;
      service.addToQueue(userId1);
      service.addToQueue(userId2);

      userService.getUserRanked
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(100);

      const result = await service.findMatch(userId1);
      expect(result).toBe(userId2);

      const roomId = `room-${userId1}-${userId2}`;
      expect(chatGateway.notifyMatch).toHaveBeenCalledWith(
        userId1,
        userId2,
        roomId,
      );
    });

    it('should not find a match if no matching users', async () => {
      const userId1 = 1;
      const userId2 = 2;
      service.addToQueue(userId1);
      service.addToQueue(userId2);

      userService.getUserRanked
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(200);

      const result = await service.findMatch(userId1);
      expect(result).toBeUndefined();
    });
  });
});
