import { Controller, Get, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { TournamentService } from '../../services/tournament/TournamentService';
import { Tournament } from '../../interfaces/userInterface';
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
}
