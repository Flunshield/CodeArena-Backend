import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient();

/**
 * Service fournissant des fonctionnalités liées aux opérations du tableau de bord.
 *
 * @remarks
 * Ce service inclut des méthodes pour vérifier le classement d'un utilisateur en fonction de ses points et fournir des informations sur les utilisateurs au-dessus et en dessous de lui dans le classement.
 *
 * @public
 */
@Injectable()
export class DashboardService {
  /**
   * Vérifie le classement d'un utilisateur en fonction de ses points et fournit des informations sur les utilisateurs au-dessus et en dessous de lui dans le classement.
   *
   * @param id - L'identifiant unique de l'utilisateur.
   * @returns Un objet contenant des informations sur le classement de l'utilisateur, les utilisateurs au-dessus et en dessous.
   *
   * @throws Error si l'utilisateur n'est pas trouvé ou s'il y a une erreur lors de la récupération des données.
   *
   * @beta
   */
  async checkRankUser(id: number) {
    // Récupère les informations de classement de l'utilisateur depuis la base de données
    const userWithRankings = await prisma.userRanking.findFirst({
      where: {
        userID: id,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            avatar: true,
          },
        },
      },
    });

    // Extrait les points de l'utilisateur
    const points = userWithRankings.points;

    // Trouve les utilisateurs au-dessus de l'utilisateur actuel dans le classement
    const usersAbove = await prisma.userRanking.findMany({
      where: {
        points: {
          gt: points,
        },
        userID: {
          not: id,
        },
      },
      orderBy: {
        points: 'desc',
      },
      take: 2,
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            avatar: true,
          },
        },
      },
    });

    // Trouve les utilisateurs en dessous de l'utilisateur actuel dans le classement
    const usersBelow = await prisma.userRanking.findMany({
      where: {
        points: {
          lte: points,
        },
        userID: {
          not: id,
        },
      },
      orderBy: {
        points: 'desc',
      },
      take: 2,
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            avatar: true,
          },
        },
      },
    });

    // Crée un objet contenant les informations sur l'utilisateur
    return {
      usersAbove: usersAbove,
      user: userWithRankings,
      usersBelow: usersBelow,
    };
  }
}
