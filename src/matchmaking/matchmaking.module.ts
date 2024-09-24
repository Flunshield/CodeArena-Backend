import { Module } from '@nestjs/common';
import { MatchmakingController } from './controllers/matchmaking.controller';
import { MatchmakingService } from './services/matchmaking.service';
import { PrismaClient } from '@prisma/client';
import { ChatGateway } from './services/matchmaking.gateway';
import { QueueService } from './services/queue.service';
import { RoomService } from './services/room.service';
import { GameService } from './services/game.service';

@Module({
  providers: [
    MatchmakingService,
    PrismaClient,
    ChatGateway,
    QueueService,
    RoomService,
    GameService,
  ],
  controllers: [MatchmakingController],
})
export class MatchmakingModule {}
