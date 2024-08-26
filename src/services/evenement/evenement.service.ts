import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'; // Import SortOrder from @prisma/client
import { PdfService } from '../pdfservice/pdf.service';
import { MailService } from 'src/email/service/MailService';
import { ADMIN, ENTREPRISE } from 'src/constantes/contante';

const prisma: PrismaClient = new PrismaClient();
@Injectable()
export class EvenementService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
  ) {}
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
      const user = await prisma.user.findFirst({
        where: {
          userName: eventData.userName,
        },
      });

      delete eventData.userName;
      eventData.userIDEntreprise = user.id;
      // Convertir les dates en objets Date si elles sont sous forme de chaîne
      eventData.startDate = new Date(eventData.startDate);
      eventData.endDate = new Date(eventData.endDate);
      eventData.playerMax = parseInt(eventData.playerMax, 10);
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
    const user = await prisma.user.findFirst({
      where: {
        id: eventCreated.userIDEntreprise,
      },
    });

    const devis = await this.pdfService.generateDevisPDF(eventCreated);

    if (user.email) {
      await this.mailService.sendDevisByEmail(user, devis);
    }

    return devis;
  }

  async findEventsEntreprise(
    order: 'asc' | 'desc',
    currentPage: number,
    itemPerPage: string,
    accepted: string,
    searchTitle: string,
    id: string,
  ) {
    try {
      const numberPerPage = parseInt(itemPerPage, 10);
      const offset = (currentPage - 1) * numberPerPage;
      const isAccepted =
        accepted === 'all' ? undefined : accepted === 'oui' ? true : false;

      const user = await prisma.user.findFirst({
        where: {
          id: parseInt(id),
        },
        include: {
          groups: true,
        },
      });
      let events = [];
      let countEvent = 0;

      const getEvents = async (conditions = {}) => {
        events = await prisma.events.findMany({
          take: numberPerPage,
          skip: offset,
          where: {
            accepted: isAccepted,
            title: {
              contains: searchTitle || '',
            },
            ...conditions,
          },
          orderBy: {
            startDate: order,
          },
        });

        countEvent = await prisma.events.count({
          where: conditions,
        });
      };

      if (user.groups.roles === ADMIN) {
        await getEvents();
      }

      if (user.groups.roles === ENTREPRISE) {
        await getEvents({ userIDEntreprise: parseInt(id) });
      }

      return { items: events, total: countEvent };
    } catch (error) {
      console.error(error);
      throw error; // Renvoyer l'erreur après l'avoir loguée
    }
  }

  async findEventEntreprise(id: string) {
    try {
      const event = id
        ? await prisma.events.findFirst({
            where: {
              id: parseInt(id, 10),
            },
          })
        : '';

      return id ? event : '';
    } catch (error) {
      console.error(error);
      throw error; // Renvoyer l'erreur après l'avoir loguée
    }
  }

  async validateEvent(id: any) {
    try {
      const event = await prisma.events.update({
        where: {
          id: parseInt(id, 10),
        },
        data: {
          accepted: true,
        },
      });

      if (event) {
        return { status: HttpStatus.OK, event: event };
      }
    } catch (error) {
      console.error(error);
      throw error; // Renvoyer l'erreur après l'avoir loguée
    }
  }

  async findEventsEntrepriseById(id: any) {
    try {
      return await prisma.events.findMany({
        where: {
          userIDEntreprise: parseInt(id, 10),
        },
      });
    } catch (error) {
      console.error(error);
      throw error; // Renvoyer l'erreur après l'avoir loguée
    }
  }

  async sendFacture(event) {
    try {
      const eventCreated = await prisma.events.findFirst({
        where: {
          id: parseInt(event.id),
        },
      });
      const user = await prisma.user.findFirst({
        where: {
          id: eventCreated.userIDEntreprise,
        },
      });

      const facture = await this.pdfService.generateFacturePDF(
        user,
        eventCreated,
      );

      if (user.email) {
        await this.mailService.sendFactureByEmail(user, facture);
      }

      return facture;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
