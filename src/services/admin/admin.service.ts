import { Injectable } from '@nestjs/common';
import { Titles } from '../../interfaces/userInterface';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AdminService {
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

  async deleteTitle(title: Titles) {
    return prisma.title.delete({
      where: {
        id: title.id,
      },
    });
  }

  async createTitles(title: Titles) {
    return prisma.title.create({
      data: {
        label: title.label,
        value: title.value,
      },
    });
  }
}
