import { Test, TestingModule } from '@nestjs/testing';
import { EntrepriseController } from './entreprise.controller';

describe('EntrepriseController', () => {
  let controller: EntrepriseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntrepriseController],
    }).compile();

    controller = module.get<EntrepriseController>(EntrepriseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
