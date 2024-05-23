// matchmaking.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingService } from './matchmaking.service';
import { PrismaClient } from '@prisma/client';
import { ChatGateway } from './matchmaking.gateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let mockChatGateway: DeepMockProxy<ChatGateway>;

  beforeEach(async () => {
    mockPrisma = mockDeep<PrismaClient>();
    mockChatGateway = mockDeep<ChatGateway>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
        { provide: PrismaClient, useValue: mockPrisma },
        { provide: ChatGateway, useValue: mockChatGateway },
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

  describe('findMatch', () => {
    it('should return undefined if user is not in the queue', async () => {
      const userId = 1;
      const result = await service.findMatch(userId);
      expect(result).toBeUndefined();
    });

    it('should return undefined if user has null ranking', async () => {
      const userId = 1;
      service.addToQueue(userId);
      mockPrisma.user.findUnique.mockResolvedValue(null as any);

      const result = await service.findMatch(userId);
      expect(result).toBeUndefined();
    });

    it('should find a match and notify users', async () => {
      const userId1 = 1;
      const userId2 = 2;
      service.addToQueue(userId1);
      service.addToQueue(userId2);

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ userRanking: [{ rankingsID: 100 }] } as any)
        .mockResolvedValueOnce({ userRanking: [{ rankingsID: 100 }] } as any);

      const result = await service.findMatch(userId1);
      expect(result).toBe(userId2);

      const roomId = `room-${userId1}-${userId2}`;
      expect(mockChatGateway.notifyMatch).toHaveBeenCalledWith(
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

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ userRanking: [{ rankingsID: 100 }] } as any)
        .mockResolvedValueOnce({ userRanking: [{ rankingsID: 200 }] } as any);

      const result = await service.findMatch(userId1);
      expect(result).toBeUndefined();
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

  describe('getUserRanking', () => {
    it('should return the user ranking if user is found', async () => {
      const userId = 1;
      const ranking = 100;
      mockPrisma.user.findUnique.mockResolvedValue({
        userRanking: [{ rankingsID: ranking }],
      } as any);

      const result = await service.getUserRanking(userId);
      expect(result).toBe(ranking);
    });

    it('should return null if user is not found', async () => {
      const userId = 1;
      mockPrisma.user.findUnique.mockResolvedValue(null as any);

      const result = await service.getUserRanking(userId);
      expect(result).toBeNull();
    });

    it('should return null if user ranking is not found', async () => {
      const userId = 1;
      mockPrisma.user.findUnique.mockResolvedValue({ userRanking: [] } as any);

      const result = await service.getUserRanking(userId);
      expect(result).toBeNull();
    });
  });
});
