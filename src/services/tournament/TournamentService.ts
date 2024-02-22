import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Tournament, UserTournament } from '../../interfaces/userInterface';

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

  /**
   * Recherche un tournoi par son identifiant.
   * @param id L'identifiant du tournoi à rechercher.
   * @returns Une promesse résolue avec les détails du tournoi trouvé.
   */
  async findTournament(id: string) {
    const tournament: Tournament = await prisma.tournaments.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    tournament.numberRegistered = await playerRegisteredFunction(parseInt(id));

    return tournament;
  }

  /**
   * Met à jour la participation d'un utilisateur à un tournoi.
   * @param user Les détails de l'utilisateur et du tournoi pour la mise à jour.
   * @returns Le code d'état HTTP correspondant au résultat de la mise à jour.
   */
  async update(user: UserTournament) {
    try {
      // Vérifier si l'utilisateur est déjà inscrit au tournoi
      const isUserRegistered = await prisma.userTournament.findFirst({
        where: {
          userID: user.userID,
          tournamentID: user.tournamentID,
        },
      });

      // Si l'utilisateur est déjà inscrit, renvoyer une erreur
      if (isUserRegistered) {
        return HttpStatus.BAD_REQUEST;
      }

      const tournament = await prisma.tournaments.findFirst({
        where: {
          id: user.tournamentID,
        },
      });
      const playerRegistered = await playerRegisteredFunction(
        user.tournamentID,
      );

      if (playerRegistered < tournament.playerMax) {
        // Si l'utilisateur n'est pas déjà inscrit, créer une nouvelle entrée dans la table userTournament
        const tournamentUpdate = await prisma.userTournament.create({
          data: {
            user: {
              connect: { id: user.userID },
            },
            tournaments: {
              connect: { id: user.tournamentID },
            },
            points: user.points,
          },
        });

        // Vérifiez si la création a réussi et renvoyez le code approprié
        if (tournamentUpdate) {
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
  async deleteUserTournament(user: UserTournament) {
    const userInTournament = await prisma.userTournament.findFirst({
      where: {
        userID: user.userID,
        tournamentID: user.tournamentID,
      },
    });
    if (userInTournament) {
      try {
        await prisma.userTournament.delete({
          where: {
            id: userInTournament.id,
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
  return prisma.userTournament.count({
    where: {
      tournamentID: id,
    },
  });
}
