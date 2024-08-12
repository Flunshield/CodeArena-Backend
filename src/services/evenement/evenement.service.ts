import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

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
  async findEvent() {
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

  async createEvent(eventData: Prisma.eventsCreateInput) {
    try {
      // Convertir les dates en objets Date si elles sont sous forme de chaîne
      eventData.startDate = new Date(eventData.startDate);
      eventData.endDate = new Date(eventData.endDate);
      // Crée un nouvel événement dans la base de données en utilisant les données fournies
      return prisma.events.create({
        data: eventData,
      });
    } catch (error) {
      console.error(error);
      throw error; // Renvoyer l'erreur après l'avoir loguée
    }
  }
}
