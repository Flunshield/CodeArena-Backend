import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class MatchmakingService {
  private queue: number[] = [];

  constructor(private prisma: PrismaClient) {}

  // Ajouter un utilisateur à la file d'attente
  addToQueue(userId: number): void {
    if (!this.queue.includes(userId)) {
      this.queue.push(userId);
      console.log(`User ${userId} joined the queue`); //TODO : log
    } else {
      console.log(`User ${userId} is already in the queue`); //TODO : log
    }
  }

  // Trouver un match pour un utilisateur dans la file d'attente
  findMatch(userId: number): number | undefined {
    if (!this.queue.includes(userId)) {
      console.log(`User ${userId} is not in the queue`); //TODO : log
      return undefined;
    }

    const match = this.queue.find((otherUserId) => otherUserId !== userId);
    if (match !== undefined) {
      // Supprimer les utilisateurs de la file d'attente
      this.queue = this.queue.filter((u) => u !== userId && u !== match);
      console.log(`User ${userId} and User ${match} matched`); //TODO : log
    }
    return match !== undefined ? match : undefined;
  }

  isUserInQueue(userId: number): boolean {
    return this.queue.includes(userId);
  }

  // Obtenir la liste des utilisateurs dans la file d'attente
  getQueue(): number[] {
    return this.queue;
  }
}
