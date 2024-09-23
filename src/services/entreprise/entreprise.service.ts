/**
 * Service fournissant la logique métier pour la gestion des entreprises.
 */
import { Injectable } from '@nestjs/common';
import { MailService } from '../../email/service/MailService';
import { PrismaClient } from '@prisma/client';
import { UserService } from '../user/user.service';
import { ENTREPRISE } from 'src/constantes/contante';

const prisma: PrismaClient = new PrismaClient();

@Injectable()
export class EntrepriseService {
  /**
   * Constructeur pour injecter les dépendances.
   * @param mailService - Service pour l'envoi des emails.
   * @param userService - Service pour la gestion des données et actions utilisateurs.
   */
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  /**
   * Envoie un email à l'aide des données fournies.
   * @param data - Données nécessaires pour enregistrer et envoyer l'email.
   * @returns Résultat de l'opération d'envoi de l'email.
   */
  async sendEmailPuzzle(data) {
    return await this.mailService.registerMail(data);
  }

  /**
   * Récupère toutes les commandes pour un utilisateur spécifique avec pagination.
   * @param id - L'identifiant de l'utilisateur.
   * @param pageNumber - Numéro de page pour la pagination (10 éléments par page).
   * @returns Un objet contenant la liste des commandes et le nombre total.
   */
  async getAllCommandeForUser(id: string, pageNumber: number) {
    try {
      const offset = (pageNumber - 1) * 10;
      const userID = parseInt(id);

      const commandes = await prisma.commandeEntreprise.findMany({
        take: 10,
        skip: offset,
        where: {
          userID: userID,
        },
      });

      const countElement = await prisma.commandeEntreprise.count({
        where: {
          userID: userID,
        },
      });

      return {
        item: commandes,
        total: countElement,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes :', error);
      throw error;
    }
  }

  /**
   * Génère un CV au format PDF pour une entreprise en fonction de l'identifiant utilisateur fourni.
   * @param id - L'identifiant de l'entreprise.
   * @param userId - L'identifiant de l'utilisateur pour lequel générer le CV.
   * @returns Le résultat du processus de génération de PDF.
   */
  async generateCvPDFForEntreprise(id: string, userId: string) {
    const isEntreprise = await prisma.user.findFirst({
      where: { id: parseInt(id as string, 10) },
      select: {
        groups: true,
      },
    });
    try {
      return await this.userService.generateCvPDF(
        id,
        isEntreprise.groups.roles === ENTREPRISE,
        userId,
      );
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Récupère une liste d'utilisateurs entreprise en fonction du nom d'utilisateur (partiel ou complet).
   * Si le nom d'utilisateur contient moins de 5 caractères, une liste vide est renvoyée.
   * @param userName - Le nom d'utilisateur ou une partie du nom d'utilisateur à rechercher.
   * @returns Une liste d'utilisateurs entreprise correspondant aux critères de recherche.
   */
  async getUserEntreprise(userName: string) {
    if (userName.length > 4) {
      return await prisma.user.findMany({
        where: {
          groups: {
            roles: ENTREPRISE,
          },
          userName: {
            contains: userName, // Permet de rechercher une correspondance partielle du nom.
          },
        },
      });
    } else {
      return [];
    }
  }

  async getCommande(id: string, userId: string) {
    try {
      const commande = await prisma.commandeEntreprise.findFirst({
        where: {
          id: parseInt(id),
          userID: parseInt(userId),
        },
      });

      const eventAssociated = await prisma.events.findFirst({
        where: {
          commandeId: commande.id,
        },
      });
      return { event: eventAssociated, commande: commande };
    } catch (error) {
      console.error('Erreur lors de la récupération de la commande :', error);
      throw error;
    }
  }
}
