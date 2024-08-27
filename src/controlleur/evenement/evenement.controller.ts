import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/auth.controller';
import { ADMIN, ENTREPRISE, USER } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { EvenementService } from '../../services/evenement/evenement.service';

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
  async createEvent(@Body() data, @Res() response) {
    const eventData = data.data;
    // Créer un nouvel événement dans la base de données
    const newEvent = await this.evenementService.createEvent(eventData);

    if (newEvent) {
      const devis = await this.evenementService.createDevis(newEvent);

      if (devis) {
        response.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'Content-Disposition; filename=devis.pdf',
          'Content-Length': devis.length,
        });
        response.end(devis);
      }
    }
  }

  @Get('/findEventsEntreprise')
  @Roles(ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async findEventsEntreprise(
    @Res() response,
    @Query('order') order,
    @Query('currentPage') currentPage,
    @Query('itemPerPage') itemPerPage,
    @Query('accepted') accepted,
    @Query('searchTitle') searchTitle,
    @Query('id') id,
  ) {
    try {
      const events = await this.evenementService.findEventsEntreprise(
        order,
        currentPage,
        itemPerPage,
        accepted,
        searchTitle,
        id,
      );
      if (events) {
        response.send(events);
      } else {
        response.send(HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Get('/findEventEntreprise')
  @Roles(ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async findEventEntreprise(@Res() response, @Query('id') id) {
    try {
      const event = await this.evenementService.findEventEntreprise(id);
      if (event) {
        response.send(event);
      } else {
        response.send(HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      console.log(error);
    }
  }
  @Get('/findEventsEntrepriseById')
  @Roles(ENTREPRISE)
  @UseGuards(RolesGuard)
  async findEventsEntrepriseById(@Res() response, @Query('id') id) {
    try {
      const event = await this.evenementService.findEventsEntrepriseById(id);
      if (event) {
        response.send(event);
      } else {
        response.send(HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Post('validateEvent')
  @Roles(ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async validateEvent(@Body() data, @Res() response) {
    const id = data.data.id;
    const event = await this.evenementService.validateEvent(id);
    if (event.status === HttpStatus.OK) {
      response.sendStatus(event.status);
    } else {
      response.send(HttpStatus.NOT_FOUND);
    }
  }

  @Delete('deleteEvent')
  @Roles(ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async deleteEvent(@Body() data, @Res() response) {
    const userId = data.userId;
    const idElementToDelete = data.idElementToDelete;
    const event = await this.evenementService.deleteEvent(
      userId,
      idElementToDelete,
    );
    if (event.status === HttpStatus.OK) {
      response.sendStatus(event.status);
    } else {
      response.send(HttpStatus.NOT_FOUND);
    }
  }
}
