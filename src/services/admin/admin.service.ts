import { Injectable } from '@nestjs/common';
import { puzzles, Titles, User } from '../../interfaces/userInterface';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AdminService {
  /**
   * Met à jour un titre dans la base de données.
   * @param title - L'objet contenant les informations du titre à mettre à jour.
   * @returns Une promesse résolue avec le titre mis à jour.
   */
  async updateTitle(title: Titles) {
    return prisma.title.update({
      where: {
        id: title.id,
      },
      data: {
        label: title.label,
        value: title.value,
      },
    });
  }

  /**
   * Supprime un titre spécifique de la base de données.
   * @param title - L'objet contenant l'identifiant du titre à supprimer.
   * @returns Une promesse résolue avec le titre supprimé.
   */
  async deleteTitle(title: Titles) {
    return prisma.title.delete({
      where: {
        id: title.id,
      },
    });
  }

  /**
   * Crée un nouveau titre dans la base de données.
   * @param title - L'objet `Titles` contenant les données pour le nouveau titre.
   * @returns Une promesse résolue avec le titre nouvellement créé.
   */
  async createTitles(title: Titles) {
    return prisma.title.create({
      data: {
        label: title.label,
        value: title.value,
      },
    });
  }

  /**
   * Supprime un utilisateur et toutes les entrées associées dans diverses tables liées.
   * Cette méthode supprime d'abord toutes les entrées liées à l'utilisateur dans les tables `userRanking`,
   * `userTournament`, `userMatch`, et `userEvent`, avant de supprimer l'utilisateur lui-même de la base de données.
   *
   * TODO: Considérer l'implémentation de l'enregistrement de l'utilisateur dans une table historique pour conserver les informations suite à la suppression.
   *
   * @param user - L'objet `User` contenant l'identifiant de l'utilisateur à supprimer.
   * @returns Une promesse résolue avec l'objet utilisateur supprimé.
   */
  async deleteUser(user: User) {
    try {
      // Supprimer les entrées liées dans userRanking
      await prisma.userRanking.deleteMany({
        where: {
          userID: user.id,
        },
      });

      // Supprimer les entrées liées dans userTournament
      await prisma.userTournament.deleteMany({
        where: {
          userID: user.id,
        },
      });

      // Supprimer les entrées liées dans userMatch
      await prisma.userMatch.deleteMany({
        where: {
          userID: user.id,
        },
      });

      // Supprimer les entrées liées dans userEvent
      await prisma.userEvent.deleteMany({
        where: {
          userID: user.id,
        },
      });

      // Supprimer les entrées liées dans commandeEntreprise
      await prisma.commandeEntreprise.deleteMany({
        where: {
          userID: user.id,
        },
      });

      // Supprimer les entrées liées dans puzzlesEntreprise
      await prisma.puzzlesEntreprise.deleteMany({
        where: {
          userID: user.id,
        },
      });

      // Supprimer les entrées liées dans puzzleSend
      await prisma.puzzleSend.deleteMany({
        where: {
          userID: user.id,
        },
      });

      // Supprimer les entrées liées dans cvUser
      await prisma.cvUser.deleteMany({
        where: {
          userID: user.id,
        },
      });

      // Ajouter une entrée dans histories avant de supprimer l'utilisateur
      await prisma.histories.create({
        data: {
          modificationType: 'DELETE',
          details: `Suppression de l'utilisateur ${user.userName}`,
          modificationDate: new Date(),
          oldValue: JSON.stringify(user), // Sauvegarder les informations de l'utilisateur supprimé
          newValue: 'Utilisateur supprimé', // Pas de nouvelle valeur, car l'utilisateur est supprimé
        },
      });

      // Supprimer l'utilisateur lui-même
      const deletedUser = await prisma.user.delete({
        where: {
          id: user.id,
        },
      });

      return deletedUser;
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de l'utilisateur et des relations associées :",
        error,
      );
      throw error;
    }
  }

  /**
   * Met à jour les points d'un utilisateur spécifique dans la table de classement des utilisateurs.
   * Cette fonction commence par récupérer l'entrée de classement de l'utilisateur dans la base de données.
   * Si une entrée de classement pour l'utilisateur est trouvée, elle réinitialise les points de l'utilisateur à zéro et met à jour l'ID de classement.
   * Si aucune entrée de classement n'est trouvée pour l'utilisateur, une erreur est levée.
   *
   * @param user - L'objet `User` contenant l'identifiant de l'utilisateur dont les points doivent être mis à jour.
   * @returns Une promesse résolue avec l'entrée de classement mise à jour de l'utilisateur.
   * @throws {Error} Si aucune entrée de classement n'est trouvée pour l'utilisateur spécifié.
   */
  async patchPointsUser(user: User) {
    const userRankingEntry = await prisma.userRanking.findFirst({
      where: {
        userID: user.id,
      },
    });

    if (!userRankingEntry) {
      throw new Error(`No userRanking entry found for user with ID ${user.id}`);
    }

    return prisma.userRanking.update({
      where: {
        id: userRankingEntry.id,
      },
      data: {
        points: 0,
        rankingsID: 1,
      },
    });
  }

  async getPuzzles(pageNumber) {
    const offset = (pageNumber - 1) * 10;
    const puzzles = await prisma.puzzles.findMany({
      take: 10,
      skip: offset,
      include: {
        rankings: true,
        events: true,
      },
    });
    const count = await prisma.puzzles.count();
    return { items: puzzles, count: count };
  }

  async deletePuzzle(puzzleId: string) {
    return prisma.puzzles.delete({
      where: {
        id: parseInt(puzzleId),
      },
    });
  }

  async updatePuzzleAdmin(data: puzzles) {
    return prisma.puzzles.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        details: data.details,
        tests: data.tests,
        rankingsID: data.rankingsID
          ? parseInt(data.rankingsID.toString())
          : undefined,
      },
    });
  }
}
