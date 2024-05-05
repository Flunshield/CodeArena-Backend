import { Test, TestingModule } from '@nestjs/testing';
import { PuzzleController } from './puzzle.controller';

describe('PuzzleController', () => {
  let controller: PuzzleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuzzleController],
    }).compile();

    controller = module.get<PuzzleController>(PuzzleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
