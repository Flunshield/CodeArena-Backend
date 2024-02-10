import { Injectable } from '@nestjs/common';
import { Event } from '../../interfaces/userInterface';
import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient();
@Injectable()
export class EvenementService {
  /**
   * Récupère tous les événements planifiés dans le futur.
   *
   * @returns Une liste d'objets représentant les événements futurs.
   *
   * @throws Error si une erreur se produit lors de la récupération des événements.
   *
   * @beta
   */
  async findEvent(): Promise<Event[]> {
    /**
     * Récupère tous les événements planifiés dans le futur depuis la base de données.
     * Les événements sont triés par date de début par ordre croissant.
     */
    return prisma.events.findMany({
      where: {
        startDate: {
          gte: new Date(), // Pour s'assurer que la date est dans le futur
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }
}
