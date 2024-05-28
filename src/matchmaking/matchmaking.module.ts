import { Module } from '@nestjs/common';
import { MatchmakingController } from './controllers/matchmaking.controller';
import { MatchmakingService } from './services/matchmaking.service';
import { PrismaClient } from '@prisma/client';
import { ChatGateway } from './services/matchmaking.gateway';

@Module({
  providers: [MatchmakingService, PrismaClient, ChatGateway],
  controllers: [MatchmakingController],
})
export class MatchmakingModule {}
