export interface AddMessageDto {
  userId: number;
  username: string;
  body: string;
  timestamp: number;
  roomId: string;
  end: boolean;
}
export interface Room {
  roomId: string;
  user1: number;
  user2: number;
  puzzle: object;
  startTimestamp: number;
}
