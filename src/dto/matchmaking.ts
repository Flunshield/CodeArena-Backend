// dto/matchmaking.ts
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class JoinQueueDto {
  @IsNotEmpty()
  @IsInt()
  id: number;
}

export class LeaveQueueDto {
  @IsNotEmpty()
  @IsInt()
  id: number;
}

export class LeaveRoomDto {
  @IsNotEmpty()
  @IsInt()
  id: number;
}

export class AddMessageDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}

export class MatchFoundDto {
  userId1: number;
  userId2: number;
  roomId: string;
}

export class CreateRoomDto {
  firstUser: number;
  puzzleId: number;
  startTimestamp: number;
}
