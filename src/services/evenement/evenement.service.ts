/**
 * Service fournissant la logique métier pour la gestion des événements.
 */
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PdfService } from '../pdfservice/pdf.service';
import { MailService } from '../../email/service/MailService';
import { ADMIN, ENTREPRISE } from 'src/constantes/contante';
import { UserEvent, Event } from 'src/interfaces/userInterface';

const prisma: PrismaClient = new PrismaClient();

@Injectable()
export class EvenementService {
  async deleteEvent(userId: string, idElementToDelete: string) {
    try {
      let event = undefined;
      const userGroup = await prisma.user.findFirst({
        where: {
          id: parseInt(userId, 10),
        },
        include: {
          groups: true,
        },
      });

      if (userGroup.groups.roles === ADMIN) {
        event = await prisma.events.delete({
          where: {
            id: parseInt(idElementToDelete, 10),
          },
        });
      } else if (userGroup.groups.roles === ENTREPRISE) {
        event = await prisma.events.delete({
          where: {
            id: parseInt(idElementToDelete, 10),
            userIDEntreprise: parseInt(userId, 10),
          },
        });
      }

      if (event) {
        return { status: HttpStatus.OK, event: event };
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  /**
   * Constructeur pour injecter les dépendances.
   * @param pdfService - Service pour la génération de PDF.
   * @param mailService - Service pour l'envoi d'emails.
   */
  constructor(
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Récupère tous les événements planifiés dans le futur.
   *
   * @returns Une liste d'objets représentant les événements futurs.
   * @throws Error si une erreur se produit lors de la récupération des événements.
   */
  async findEvent() {
    const event = await prisma.events.findMany({
      where: {
        startDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
    return event;
  }

  async findEventSingle(id: string) {
    const event: Event = await prisma.events.findFirst({
      where: {
        id: parseInt(id),
      },
    });
    event.numberRegistered = await playerRegisteredFunction(parseInt(id));
    return event;
  }

  /**
   * Crée un nouvel événement à partir des données fournies.
   * @param eventData - Les données de l'événement à créer.
   * @returns L'événement créé.
   * @throws Error si une erreur se produit lors de la création de l'événement.
   */
  async createEvent(eventData) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          userName: eventData.userName,
        },
      });

      delete eventData.userName;
      eventData.userIDEntreprise = user.id;
      eventData.startDate = new Date(eventData.startDate);
      eventData.endDate = new Date(eventData.endDate);
      eventData.playerMax = parseInt(eventData.playerMax, 10);

      const creatEvent = await prisma.events.create({
        data: eventData,
      });

      if (creatEvent) {
        return creatEvent;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Crée un devis au format PDF pour un événement donné.
   * @param newEvent - Les données de l'événement pour générer le devis.
   * @returns Le devis généré en format PDF.
   * @throws Error si une erreur se produit lors de la génération du devis.
   */
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

  /**
   * Récupère les événements d'une entreprise avec pagination et filtres.
   * @param order - Ordre de tri (ascendant ou descendant).
   * @param currentPage - Page actuelle pour la pagination.
   * @param itemPerPage - Nombre d'éléments par page.
   * @param accepted - Filtre d'événements acceptés ou non.
   * @param searchTitle - Filtre de titre d'événement.
   * @param id - Identifiant de l'entreprise.
   * @returns La liste des événements et le nombre total.
   * @throws Error si une erreur se produit lors de la récupération des événements.
   */
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
      throw error;
    }
  }

  /**
   * Récupère un événement spécifique d'une entreprise.
   * @param id - L'identifiant de l'événement.
   * @returns L'événement correspondant ou une chaîne vide si non trouvé.
   * @throws Error si une erreur se produit lors de la récupération de l'événement.
   */
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
      throw error;
    }
  }

  /**
   * Valide un événement en le marquant comme accepté.
   * @param id - L'identifiant de l'événement à valider.
   * @returns Un objet contenant le statut et l'événement validé.
   * @throws Error si une erreur se produit lors de la validation de l'événement.
   */
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
      throw error;
    }
  }

  /**
   * Récupère tous les événements associés à une entreprise par son identifiant.
   * @param id - L'identifiant de l'entreprise.
   * @returns Une liste d'événements associés à l'entreprise.
   * @throws Error si une erreur se produit lors de la récupération des événements.
   */
  async findEventsEntrepriseById(id: any) {
    try {
      return await prisma.events.findMany({
        where: {
          userIDEntreprise: parseInt(id, 10),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Met à jour la participation d'un utilisateur à un tournoi.
   * @param user Les détails de l'utilisateur et du tournoi pour la mise à jour.
   * @returns Le code d'état HTTP correspondant au résultat de la mise à jour.
   */
  async updateUserEvent(user: UserEvent) {
    try {
      // Vérifier si l'utilisateur est déjà inscrit au tournoi
      const isUserRegistered = await prisma.userEvent.findFirst({
        where: {
          userID: user.userID,
          eventsID: user.eventsID,
        },
      });

      // Si l'utilisateur est déjà inscrit, renvoyer une erreur
      if (isUserRegistered) {
        return HttpStatus.BAD_REQUEST;
      }

      const event = await prisma.events.findFirst({
        where: {
          id: user.eventsID,
        },
      });
      const playerRegistered = await playerRegisteredFunction(user.eventsID);
      if (playerRegistered < event.playerMax) {
        // Si l'utilisateur n'est pas déjà inscrit, créer une nouvelle entrée dans la table userTournament
        const eventUpdate = await prisma.userEvent.create({
          data: {
            user: {
              connect: { id: user.userID },
            },
            events: {
              connect: { id: user.eventsID },
            },
            points: user.points,
          },
        });

        // Vérifiez si la création a réussi et renvoyez le code approprié
        if (eventUpdate) {
          return HttpStatus.CREATED;
        } else {
          return HttpStatus.INTERNAL_SERVER_ERROR;
        }
      } else {
        return HttpStatus.NOT_ACCEPTABLE;
      }
    } catch (e) {
      console.error('Error:', e);
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Met à jour la participation d'un utilisateur à un tournoi.
   * @param user Les détails de l'utilisateur et du tournoi pour la mise à jour.
   * @returns Le code d'état HTTP correspondant au résultat de la mise à jour.
   */
  async deleteUserEvent(user: UserEvent) {
    const userInEvent = await prisma.userEvent.findFirst({
      where: {
        userID: user.userID,
        eventsID: user.eventsID,
      },
    });
    if (userInEvent) {
      try {
        await prisma.userEvent.delete({
          where: {
            id: userInEvent.id,
          },
        });
        return HttpStatus.OK;
      } catch (e) {}
    } else {
      return HttpStatus.NOT_FOUND;
    }
  }
}

/**
 * Compte le nombre de joueurs inscrits à un tournoi.
 * @param id L'identifiant du tournoi pour lequel on compte les joueurs inscrits.
 * @returns Le nombre de joueurs inscrits au tournoi.
 */
async function playerRegisteredFunction(id: number) {
  return prisma.userEvent.count({
    where: {
      eventsID: id,
    },
  });
}
