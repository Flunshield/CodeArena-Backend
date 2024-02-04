import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Tournament } from '../../interfaces/userInterface';

const prisma: PrismaClient = new PrismaClient();

/**
 * Service fournissant des fonctionnalités liées aux tournois.
 *
 * @remarks
 * Ce service inclut des méthodes pour récupérer des informations sur les tournois à venir.
 *
 * @public
 */
@Injectable()
export class TournamentService {
  /**
   * Récupère le tournoi avec la date de début la plus proche dans le futur.
   *
   * @returns Un objet représentant le tournoi à venir avec la date de début la plus proche.
   *
   * @throws Error si une erreur se produit lors de la récupération du tournoi.
   *
   * @beta
   */
  async findTournamentwithTheEarliestDate() {
    /**
     * Récupère le tournoi avec la date de début la plus proche dans le futur depuis la base de données.
     * Les tournois sont triés par date de début par ordre croissant.
     */
    const tournament: Tournament = await prisma.tournaments.findFirst({
      where: {
        startDate: {
          gte: new Date(), // Pour s'assurer que la date est dans le futur
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
    return tournament;
  }

  /**
   * Récupère les dix prochains tournois planifiés dans le futur.
   *
   * @returns Une liste d'objets représentant les dix prochains tournois à venir.
   *
   * @throws Error si une erreur se produit lors de la récupération des tournois.
   *
   * @beta
   */
  async findNextTenTournament() {
    /**
     * Récupère les dix prochains tournois planifiés dans le futur depuis la base de données.
     * Les tournois sont triés par date de début par ordre croissant.
     */
    const tournament: Tournament[] = await prisma.tournaments.findMany({
      where: {
        startDate: {
          gte: new Date(), // Pour s'assurer que la date est dans le futur
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 10,
    });
    return tournament;
  }
}
