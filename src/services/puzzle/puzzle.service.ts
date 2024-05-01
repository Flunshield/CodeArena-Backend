/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ENTREPRISE } from '../../constantes/contante';

const prisma = new PrismaClient();

@Injectable()
export class PuzzleService {
  async createPuzzle(data) {
    if (data.user.groups.roles === ENTREPRISE) {
      const userID = parseInt(data.user.id, 10);
      const tests =
        typeof data.tests === 'string' ? JSON.parse(data.tests) : data.tests;
      try {
        return await prisma.puzzlesEntreprise.create({
          data: {
            userID: userID,
            tests: tests,
            details: data.details,
            title: data.title,
          },
        });
      } catch (e) {
        console.log(e);
      }
    }
  }

  async findPuzzles(id: string) {
    return prisma.puzzlesEntreprise.findMany({
      where: {
        userID: parseInt(id),
      },
    });
  }

  async updatePuzzlePartially(updatePuzzleDto: any) {
    const data = updatePuzzleDto.data;
    const puzzleID = parseInt(data.id, 10);
    try {
      return await prisma.puzzlesEntreprise.update({
        where: {
          id: puzzleID,
        },
        data: {
          tests: data.tests,
          details: data.details,
          title: data.title,
        },
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async deletePuzzle(id: string): Promise<any> {
    const puzzleID = parseInt(id, 10);
    try {
      return await prisma.puzzlesEntreprise.delete({
        where: { id: puzzleID },
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async findOnePuzzle(id: string) {
    // Récupération de l'entrée de la base de données
    const puzzle = await prisma.puzzlesEntreprise.findFirst({
      where: {
        id: parseInt(id),
      },
      include: {
        // Ou `select`, selon ce que tu veux exactement récupérer
        user: true, // Inclure l'utilisateur pour exemple
        // Ajouter d'autres relations si nécessaire
      },
    });

    if (!puzzle) {
      return null; // ou gérer l'absence de l'objet
    }

    // Formatage des données reçues
    return formatPuzzleData(puzzle);
  }

  async findPuzzleForGame(decodedToken) {
    const puzzle = await prisma.puzzlesEntreprise.findFirst({
      where: {
        id: parseInt(decodedToken.puzzleId),
      },
    });

    if (!puzzle) {
      return null;
    }

    return puzzle;
  }
}

function formatPuzzleData(puzzle) {
  return {
    id: puzzle.id,
    details: puzzle.details,
    tests: puzzle.tests, // Supposant que `tests` est un champ JSON
    user: puzzle.user
      ? {
          id: puzzle.user.id,
          fullName: `${puzzle.user.firstName} ${puzzle.user.lastName}`,
          email: puzzle.user.email,
          company: puzzle.user.company,
        }
      : null,
  };
}
