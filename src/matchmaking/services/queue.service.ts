import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueService {
  private queue: number[] = [];

  addUser(userId: number): void {
    if (!this.queue.includes(userId)) {
      this.queue.push(userId);
    }
  }

  removeUser(userId: number): void {
    this.queue = this.queue.filter((id) => id !== userId);
  }

  getQueue(): number[] {
    return this.queue;
  }

  isUserInQueue(userId: number): boolean {
    return this.queue.includes(userId);
  }
}
