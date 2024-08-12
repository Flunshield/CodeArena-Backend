import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/auth.controller';
import { ADMIN, ENTREPRISE, USER } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { EvenementService } from '../../services/evenement/evenement.service';
import { Prisma } from '@prisma/client';

@Controller('evenement')
export class EvenementController {
  constructor(private readonly evenementService: EvenementService) {}

  @Get('/findEvents')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async findTournaments(@Res() response) {
    try {
      const events = await this.evenementService.findEvent();
      if (events) {
        response.send(events);
      } else {
        response.send(HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Post('/createEvent')
  @Roles(ADMIN)
  @UseGuards(RolesGuard)
  async createEvent(@Body() data) {
    const eventData: Prisma.eventsCreateInput = data.data;
    console.log(eventData);
    // Créer un nouvel événement dans la base de données
    const newEvent = await this.evenementService.createEvent(eventData);

    return newEvent;
  }
}
