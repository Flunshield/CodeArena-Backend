import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
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
import { UserEvent, Event } from 'src/interfaces/userInterface';

@Controller('evenement')
export class EvenementController {
  constructor(private readonly evenementService: EvenementService) {}

  @Get('/findEvents')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async findEvent(@Res() response) {
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
  @Get('/findEventSingle')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async findEventSingle(@Query('id') id: string, @Res() response) {
    try {
      const events: Event = await this.evenementService.findEventSingle(id);
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

  @Post('/inscription')
  @Roles(USER)
  @UseGuards(RolesGuard)
  async update(@Body() data, @Res() response) {
    const user: UserEvent = data.data;
    const res: HttpStatus = await this.evenementService.updateUserEvent(user);
    if (res === HttpStatus.CREATED) {
      response.send(res);
    } else if (res === HttpStatus.NOT_ACCEPTABLE) {
      // Si la mise à jour échoue, on envoie une exception HTTP avec un code 406
      throw new HttpException('Utilistaeur inconnu', HttpStatus.NOT_ACCEPTABLE);
    } else {
      // Si la mise à jour échoue, on envoie une exception HTTP avec un code 400
      throw new HttpException('Utilistaeur inconnu', HttpStatus.BAD_REQUEST);
    }
  }
  @Delete('/unsubscribe')
  @Roles(USER)
  @UseGuards(RolesGuard)
  async delete(@Body() user: UserEvent): Promise<HttpException> {
    const response: HttpStatus =
      await this.evenementService.deleteUserEvent(user);
    if (response === HttpStatus.OK) {
      // Si la mise à jour réussi, on envoie un code HTTP 200.
      return new HttpException('Utilistaeur mis à jour', HttpStatus.OK);
    } else {
      // Si la mise à jour échoue, on envoie une exception HTTP avec un code 400
      throw new HttpException('Utilistaeur inconnu', HttpStatus.NOT_FOUND);
    }
  }
}
