import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from '../services/matchmaking.service';

describe('MatchmakingController', () => {
  let controller: MatchmakingController;
  let service: MatchmakingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchmakingController],
      providers: [MatchmakingService],
    }).compile();

    controller = module.get<MatchmakingController>(MatchmakingController);
    service = module.get<MatchmakingService>(MatchmakingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('joinQueue', () => {
    it('should add user to queue', async () => {
      const userId = { id: 1 };
      jest.spyOn(service, 'addToQueue').mockImplementation(() => {});
      const result = await controller.joinQueue(userId);
      expect(result).toEqual({ message: 'Join queue request received' });
      expect(service.addToQueue).toHaveBeenCalledWith(userId.id);
    });
  });

  describe('findMatch', () => {
    it('should return message if user is not in queue', async () => {
      const userId = { id: 1 };
      jest.spyOn(service, 'isUserInQueue').mockResolvedValue(false as never);
      const result = await controller.findMatch(userId);
      expect(result).toEqual({ message: 'You are not in the queue' });
    });

    // Add more test cases for findMatch
  });

  describe('getQueue', () => {
    it('should return queue', () => {
      const queue = [1, 2, 3];
      jest.spyOn(service, 'getQueue').mockReturnValue(queue);
      expect(controller.getQueue()).toEqual(queue);
    });
  });
});
