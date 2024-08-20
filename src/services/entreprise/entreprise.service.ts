import { Injectable } from '@nestjs/common';
import { MailService } from '../../email/service/MailService';
import { PrismaClient } from '@prisma/client';
import { UserService } from '../user/user.service';
import { ENTREPRISE } from 'src/constantes/contante';

const prisma: PrismaClient = new PrismaClient();
@Injectable()
export class EntrepriseService {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  async sendEmailPuzzle(data) {
    return await this.mailService.registerMail(data);
  }

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
      console.error('Error fetching commandes:', error);
      throw error;
    }
  }

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

  async getUserEntreprise(userName: string) {
    if (userName.length > 4) {
      return await prisma.user.findMany({
        where: {
          groups: {
            roles: ENTREPRISE,
          },
          userName: {
            contains: userName, // Permet de rechercher une correspondance partielle
          },
        },
      });
    } else {
      return [];
    }
  }
}
