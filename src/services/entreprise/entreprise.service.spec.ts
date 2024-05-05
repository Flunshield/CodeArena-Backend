import { Test, TestingModule } from '@nestjs/testing';
import { EntrepriseService } from './entreprise.service';

describe('EntrepriseService', () => {
  let service: EntrepriseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntrepriseService],
    }).compile();

    service = module.get<EntrepriseService>(EntrepriseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
