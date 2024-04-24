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
    const puzzleID = parseInt(updatePuzzleDto.id, 10);
    try {
      return await prisma.puzzlesEntreprise.update({
        where: {
          id: puzzleID,
        },
        data: {
          tests: updatePuzzleDto.tests,
          details: updatePuzzleDto.details,
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
}
