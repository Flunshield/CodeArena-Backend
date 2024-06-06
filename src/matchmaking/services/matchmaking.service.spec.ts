import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingService } from './matchmaking.service';
import { PrismaClient } from '@prisma/client';
import { ChatGateway } from './matchmaking.gateway';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let prisma: PrismaClient;
  let chatGateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
        {
          provide: PrismaClient,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: ChatGateway,
          useValue: {
            notifyMatch: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
    prisma = module.get<PrismaClient>(PrismaClient);
    chatGateway = module.get<ChatGateway>(ChatGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToQueue', () => {
    it('should add a user to the queue', () => {
      service.addToQueue(1);
      expect(service.getQueue()).toContain(1);
    });

    it('should not add a user to the queue if they are already in it', () => {
      service.addToQueue(1);
      service.addToQueue(1);
      expect(service.getQueue().length).toBe(1);
    });
  });

  describe('removeFromQueue', () => {
    it('should remove a user from the queue', () => {
      service.addToQueue(1);
      service.removeFromQueue(1);
      expect(service.getQueue()).not.toContain(1);
    });
  });

  describe('getUserRanking', () => {
    it('should return the user ranking', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        userRanking: [{ rankingsID: 1 }],
      } as any);

      const ranking = await service.getUserRanking(1);
      expect(ranking).toBe(1);
    });

    it('should return null if the user has no ranking', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const ranking = await service.getUserRanking(1);
      expect(ranking).toBeNull();
    });

    it('should handle errors when fetching user ranking', async () => {
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockRejectedValue(new Error('Error fetching user ranking'));

      const ranking = await service.getUserRanking(1);
      expect(ranking).toBeNull();
    });
  });

  describe('findMatch', () => {
    it('should find a match for a user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        userRanking: [{ rankingsID: 1 }],
      } as any);

      service.addToQueue(1);
      service.addToQueue(2);

      const match = await service.findMatch(1);
      expect(match).toBe(2);
      expect(chatGateway.notifyMatch).toHaveBeenCalledWith(1, 2, 'room-1-2');
    });

    it('should return undefined if no match is found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockImplementation((query) => {
        if (query.where.id === 1 || query.where.id === 2) {
          return {
            userRanking: [{ rankingsID: 1 }],
          } as any; // Cast to 'any' to bypass type issues for mock
        }
        return null;
      });

      service.addToQueue(1);
      service.addToQueue(2);

      const match = await service.findMatch(3);
      expect(match).toBeUndefined();
    });
  });

  describe('processQueue', () => {
    it('should process the queue and match users', async () => {
      jest.spyOn(service, 'findMatch').mockResolvedValue(2);

      service.addToQueue(1);
      service.addToQueue(2);

      await service.processQueue();
      expect(chatGateway.notifyMatch).toHaveBeenCalledWith(1, 2, 'room-1-2');
    });
  });
});
