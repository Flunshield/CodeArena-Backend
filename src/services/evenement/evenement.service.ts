import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'; // Import SortOrder from @prisma/client
import { PdfService } from '../pdfservice/pdf.service';

const prisma: PrismaClient = new PrismaClient();
@Injectable()
export class EvenementService {
  constructor(private readonly pdfService: PdfService) {}
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

  async createEvent(eventData) {
    try {
      // Convertir les dates en objets Date si elles sont sous forme de chaîne
      eventData.startDate = new Date(eventData.startDate);
      eventData.endDate = new Date(eventData.endDate);
      // Crée un nouvel événement dans la base de données en utilisant les données fournies
      const creatEvent = await prisma.events.create({
        data: eventData,
      });

      if (creatEvent) {
        return creatEvent;
      }
    } catch (error) {
      console.error(error);
      throw error; // Renvoyer l'erreur après l'avoir loguée
    }
  }

  async createDevis(newEvent) {
    const eventCreated = await prisma.events.findFirst({
      where: {
        id: newEvent.id,
      },
    });

    return this.pdfService.generateDevisPDF(eventCreated);
  }

  async findEventsEntreprise(
    order: 'asc' | 'desc',
    currentPage: number,
    itemPerPage: string,
    accepted: string,
    searchTitle: string,
  ) {
    try {
      const numberPerPage = parseInt(itemPerPage, 10);
      const offset = (currentPage - 1) * numberPerPage;
      const isAccepted =
        accepted === 'all' ? undefined : accepted === 'oui' ? true : false;

      // Récupère tous les événements planifiés dans le futur depuis la base de données
      // qui sont associés à une entreprise
      const events = await prisma.events.findMany({
        take: numberPerPage,
        skip: offset,
        where: {
          accepted: isAccepted,
          title: {
            contains: searchTitle !== undefined ? searchTitle : '',
          },
        },
        orderBy: {
          startDate: order,
        },
      });

      const countEvent = await prisma.events.count({});

      return { items: events, total: countEvent };
    } catch (error) {
      console.error(error);
      throw error; // Renvoyer l'erreur après l'avoir loguée
    }
  }

  
  async findEventEntreprise(id: string) {
    try {
      const event = await prisma.events.findFirst({
        where: {
          id: parseInt(id, 10),
        },
      });

      return event;
    } catch (error) {
      console.error(error);
      throw error; // Renvoyer l'erreur après l'avoir loguée
    }
  }
}
