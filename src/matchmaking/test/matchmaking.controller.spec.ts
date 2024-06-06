import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingController } from '../controllers/matchmaking.controller';
import { MatchmakingService } from '../services/matchmaking.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('MatchmakingController', () => {
  let matchmakingController: MatchmakingController;
  let matchmakingService: MatchmakingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchmakingController],
      providers: [
        {
          provide: MatchmakingService,
          useValue: {
            isUserInQueue: jest.fn(),
            isUserInRoom: jest.fn(),
            addToQueue: jest.fn(),
            getQueue: jest.fn(),
            removeFromQueue: jest.fn(),
            getRooms: jest.fn(),
            leaveRoom: jest.fn(),
          },
        },
      ],
    }).compile();

    matchmakingController = module.get<MatchmakingController>(
      MatchmakingController,
    );
    matchmakingService = module.get<MatchmakingService>(MatchmakingService);
  });

  describe('joinQueue', () => {
    it('should return success when user joins the queue', async () => {
      const requestData = { data: { id: 1 } };
      (
        jest.spyOn(matchmakingService, 'isUserInQueue') as jest.Mock
      ).mockResolvedValue(false);
      (
        jest.spyOn(matchmakingService, 'isUserInRoom') as jest.Mock
      ).mockReturnValue(false);

      const result = await matchmakingController.joinQueue(requestData);

      expect(result).toEqual({
        success: true,
        message: 'You have successfully joined the queue.',
      });
      expect(matchmakingService.addToQueue).toHaveBeenCalledWith(1);
    });

    it('should return failure when user is already in the queue', async () => {
      const requestData = { data: { id: 1 } };
      (
        jest.spyOn(matchmakingService, 'isUserInQueue') as jest.Mock
      ).mockResolvedValue(true);

      const result = await matchmakingController.joinQueue(requestData);

      expect(result).toEqual({
        success: false,
        message: 'You are already in the queue.',
      });
    });

    it('should return failure when user is already in a room', async () => {
      const requestData = { data: { id: 1 } };
      (
        jest.spyOn(matchmakingService, 'isUserInQueue') as jest.Mock
      ).mockResolvedValue(false);
      jest.spyOn(matchmakingService, 'isUserInRoom').mockReturnValue(true);

      const result = await matchmakingController.joinQueue(requestData);

      expect(result).toEqual({
        success: false,
        message: 'You are already in a room.',
      });
    });

    it('should throw an exception when an error occurs', async () => {
      const requestData = { data: { id: 1 } };
      (
        jest.spyOn(matchmakingService, 'isUserInQueue') as jest.Mock
      ).mockRejectedValue(new Error('Test error'));

      await expect(
        matchmakingController.joinQueue(requestData),
      ).rejects.toThrow(
        new HttpException(
          'Failed to join queue: Test error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getQueue', () => {
    it('should return the queue', () => {
      const queue = [{ id: 1 }, { id: 2 }];
      (jest.spyOn(matchmakingService, 'getQueue') as jest.Mock).mockReturnValue(
        queue,
      );

      const result = matchmakingController.getQueue();

      expect(result).toEqual({ success: true, queue });
    });

    it('should throw an exception when an error occurs', () => {
      jest.spyOn(matchmakingService, 'getQueue').mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() => matchmakingController.getQueue()).toThrow(
        new HttpException(
          'Failed to get queue: Test error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getRooms', () => {
    it('should return the rooms', () => {
      const rooms = [{ roomId: 'room-1-2', user1: 1, user2: 2 }];
      jest.spyOn(matchmakingService, 'getRooms').mockReturnValue(rooms);

      const result = matchmakingController.getRooms();

      expect(result).toEqual({ success: true, rooms });
    });

    it('should throw an exception when an error occurs', () => {
      jest.spyOn(matchmakingService, 'getRooms').mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() => matchmakingController.getRooms()).toThrow(
        new HttpException(
          'Failed to get rooms: Test error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('leaveQueue', () => {
    it('should return success when user leaves the queue', async () => {
      const requestData = { data: { id: 1 } };
      (
        jest.spyOn(matchmakingService, 'isUserInQueue') as jest.Mock
      ).mockResolvedValue(true);

      const result = await matchmakingController.leaveQueue(requestData);

      expect(result).toEqual({
        success: true,
        message: 'You have successfully left the queue.',
      });
      expect(matchmakingService.removeFromQueue).toHaveBeenCalledWith(1);
    });

    it('should return failure when user is not in the queue', async () => {
      const requestData = { data: { id: 1 } };
      (
        jest.spyOn(matchmakingService, 'isUserInQueue') as jest.Mock
      ).mockResolvedValue(false);

      const result = await matchmakingController.leaveQueue(requestData);

      expect(result).toEqual({
        success: false,
        message: 'You are not in the queue.',
      });
    });

    it('should throw an exception when an error occurs', async () => {
      const requestData = { data: { id: 1 } };
      (
        jest.spyOn(matchmakingService, 'isUserInQueue') as jest.Mock
      ).mockRejectedValue(new Error('Test error'));

      await expect(
        matchmakingController.leaveQueue(requestData),
      ).rejects.toThrow(
        new HttpException(
          'Failed to leave queue: Test error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('leaveRoom', () => {
    it('should return success when user leaves the room', async () => {
      const requestData = { data: { id: 1 } };
      jest.spyOn(matchmakingService, 'leaveRoom').mockReturnValue(true);

      const result = await matchmakingController.leaveRoom(requestData);

      expect(result).toEqual({
        success: true,
        message: 'You have successfully left the room.',
      });
      expect(matchmakingService.leaveRoom).toHaveBeenCalledWith(1);
    });

    it('should return failure when user is not in any room', async () => {
      const requestData = { data: { id: 1 } };
      jest.spyOn(matchmakingService, 'leaveRoom').mockReturnValue(false);

      const result = await matchmakingController.leaveRoom(requestData);

      expect(result).toEqual({
        success: false,
        message: 'You are not in any room.',
      });
    });

    it('should throw an exception when an error occurs', async () => {
      const requestData = { data: { id: 1 } };
      jest.spyOn(matchmakingService, 'leaveRoom').mockImplementation(() => {
        throw new Error('Test error');
      });

      await expect(
        matchmakingController.leaveRoom(requestData),
      ).rejects.toThrow(
        new HttpException(
          'Failed to leave room: Test error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
