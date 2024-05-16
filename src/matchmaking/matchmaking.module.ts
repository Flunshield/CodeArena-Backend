import { Module } from '@nestjs/common';
import { MatchmakingController } from './controllers/matchmaking.controller';
import { MatchmakingService } from './services/matchmaking.service';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [MatchmakingService, PrismaClient],
  controllers: [MatchmakingController],
})
export class MatchmakingModule {}
