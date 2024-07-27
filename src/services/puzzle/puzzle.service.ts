/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ADMIN, ENTREPRISE } from "../../constantes/contante";

const prisma = new PrismaClient();

@Injectable()
export class PuzzleService {
  async deletePuzzleSend(id: string) {
    if (id === "old") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      try {
        return await prisma.puzzleSend.deleteMany({
          where: {
            sendDate: {
              lt: oneMonthAgo // 'lt' signifie "less than" (inférieur à)
            }
          }
        });
      } catch (e) {
        console.error(e);
        throw e;
      }
    } else {
      const puzzleID = parseInt(id, 10);
      try {
        return await prisma.puzzleSend.delete({
          where: { id: puzzleID }
        });
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
  }

  async createPuzzle(data) {
    if (data.user.groups.roles === ENTREPRISE) {
      const userID = parseInt(data.user.id, 10);
      const tests =
        typeof data.tests === "string" ? JSON.parse(data.tests) : data.tests;
      const time = data.time.toString();

      try {
        return await prisma.puzzlesEntreprise.create({
          data: {
            userID: userID,
            tests: tests,
            details: data.details,
            title: data.title,
            time: time
          }
        });
      } catch (e) {
        console.log(e);
      }
    }
    if(data.user.groups.roles === ADMIN) {
    }
  }

  async findPuzzles(id: string, page: number, limit: number = 4) {
    const offset = (page - 1) * limit;
    const countElement = await prisma.puzzlesEntreprise.count({
      where: {
        userID: parseInt(id)
      }
    });
    const puzzleEntreprise = await prisma.puzzlesEntreprise.findMany({
      where: {
        userID: parseInt(id)
      },
      take: limit,
      skip: offset
    });

    return {
      item: puzzleEntreprise ?? [],
      total: countElement
    };
  }

  async updatePuzzlePartially(updatePuzzleDto: any) {
    const data = updatePuzzleDto.data;
    const puzzleID = parseInt(data.id, 10);
    const time = data.time.toString();

    try {
      return await prisma.puzzlesEntreprise.update({
        where: {
          id: puzzleID
        },
        data: {
          tests: data.tests,
          details: data.details,
          title: data.title,
          time: time
        }
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async deletePuzzle(puzzleId: string): Promise<any> {
    const puzzleID = parseInt(puzzleId, 10);
    try {
      return await prisma.puzzlesEntreprise.delete({
        where: { id: puzzleID }
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
        id: parseInt(id)
      },
      include: {
        // Ou `select`, selon ce que tu veux exactement récupérer
        user: true // Inclure l'utilisateur pour exemple
        // Ajouter d'autres relations si nécessaire
      }
    });

    if (!puzzle) {
      return null; // ou gérer l'absence de l'objet
    }

    // Formatage des données reçues
    return formatPuzzleData(puzzle);
  }

  async findPuzzleForGame(decodedToken) {
    const puzzleForGame = {
      puzzle: null,
      mailID: decodedToken.mailID
    };
    puzzleForGame.puzzle = await prisma.puzzlesEntreprise.findFirst({
      where: {
        id: parseInt(decodedToken.puzzleID)
      }
    });

    if (!puzzleForGame.puzzle) {
      return null;
    }
    return puzzleForGame;
  }

  async updatePuzzleAfterGame(data) {
    const mailID = parseInt(data.mailID, 10);

    try {
      const checkPuzzleGame = await prisma.puzzleSend.findFirst({
        where: {
          id: mailID
        }
      });

      if (checkPuzzleGame.validated === false) {
        return await prisma.puzzleSend.update({
          where: {
            id: mailID
          },
          data: {
            validated: true,
            result: data.result,
            testValidated: data.testValidated,
            time: data.remainingTime.toString()
          }
        });
      } else {
        return null;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async getPuzzlePlaying(data, page: number, limit: number = 3) {
    const offset = (page - 1) * limit;
    const puzzle = await prisma.puzzleSend.findMany({
      where: {
        userID: data.userID,
        validated: true
      },
      include: {
        puzzlesEntreprise: true
      },
      take: limit,
      skip: offset
    });

    const countPuzzle = await prisma.puzzleSend.count({
      where: {
        userID: data.userID,
        validated: true
      }
    });

    return {item: puzzle, total: countPuzzle};
  }

  async countPuzzlesPlayed(id) {
    return prisma.puzzleSend.count({
      where: {
        userID: parseInt(id)
      }
    });
  }

  async countPuzzlesCreated(id) {
    return prisma.puzzlesEntreprise.count({
      where: {
        userID: parseInt(id)
      }
    });
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
        company: puzzle.user.company
      }
      : null
  };
}
