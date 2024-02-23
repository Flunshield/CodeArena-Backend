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
import { TournamentService } from '../../services/tournament/TournamentService';
import { Tournament, UserTournament } from '../../interfaces/userInterface';
import { ADMIN, ENTREPRISE, USER } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../auth/auth.controller';

@Controller('tournament')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get('/findTournaments')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async findTournaments(@Res() response) {
    try {
      const getAllTournaments: Tournament[] =
        await this.tournamentService.findNextTenTournament();
      if (getAllTournaments) {
        response.send(getAllTournaments);
      } else {
        response.send(HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Get('/findTournament')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async findTournament(@Query('id') id: string, @Res() response) {
    try {
      const getTournament: Tournament =
        await this.tournamentService.findTournament(id);
      if (getTournament) {
        response.send(getTournament);
      } else {
        response.send(HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Post('/inscription')
  @Roles(USER)
  @UseGuards(RolesGuard)
  async update(@Body() data): Promise<HttpException> {
    const user: UserTournament = data.data.data;
    console.log(user)
    const response: HttpStatus = await this.tournamentService.update(user);
    if (response === HttpStatus.CREATED) {
      // Si la mise à jour réussi, on envoie un code HTTP 201.
      return new HttpException('Utilistaeur mis à jour', HttpStatus.CREATED);
    } else if (response === HttpStatus.NOT_ACCEPTABLE) {
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
  async delete(@Body() user: UserTournament): Promise<HttpException> {
    const response: HttpStatus =
      await this.tournamentService.deleteUserTournament(user);
    if (response === HttpStatus.OK) {
      // Si la mise à jour réussi, on envoie un code HTTP 200.
      return new HttpException('Utilistaeur mis à jour', HttpStatus.OK);
    } else {
      // Si la mise à jour échoue, on envoie une exception HTTP avec un code 400
      throw new HttpException('Utilistaeur inconnu', HttpStatus.NOT_FOUND);
    }
  }
}
