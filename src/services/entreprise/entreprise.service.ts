import { Injectable } from '@nestjs/common';
import { MailService } from '../../email/service/MailService';
import { PrismaClient } from '@prisma/client';
import { PAGE_SIZE } from 'src/constantes/contante';

const prisma: PrismaClient = new PrismaClient();
@Injectable()
export class EntrepriseService {
  constructor(private readonly mailService: MailService) {}

  async sendEmailPuzzle(data) {
    return await this.mailService.registerMail(data);
  }

  async getAllCommandeForUser(id: string, pageNumber: number) {
    try {
      const offset = (pageNumber - 1) * PAGE_SIZE;
      const userID = parseInt(id);

      const commandes = await prisma.commandeEntreprise.findMany({
        take: PAGE_SIZE,
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
}
