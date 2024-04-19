import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketController } from './websocket.controller';

describe('WebsocketController', () => {
  let controller: WebSocketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebSocketController],
    }).compile();

    controller = module.get<WebSocketController>(WebSocketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
