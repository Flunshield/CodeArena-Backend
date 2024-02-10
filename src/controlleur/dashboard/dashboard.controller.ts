import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { Event } from '../../interfaces/userInterface';
import { TournamentService } from '../../services/tournament/TournamentService';
import { ADMIN, ENTREPRISE, USER } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../auth/auth.controller';
import { EvenementService } from '../../services/evenement/evenement.service';

@Controller('dashboard')
export class DashboardController {
  /**
   * Crée une instance du contrôleur Dashboard.
   *
   * @param dashboardService
   * @param tournamentService
   * @param evenementService
   */
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly tournamentService: TournamentService,
    private readonly evenementService: EvenementService,
  ) {}

  @Get('/checkDashboard')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async checkDashboard(
    @Query('id') id: number,
    @Res() response,
  ): Promise<HttpException> {
    // On va chercher le rang de l'utilisateur
    const userRanking = await this.dashboardService.checkRankUser(
      parseInt(String(id)),
    );
    // On va chercher le tournoi avec la date la plus proche
    const tournament =
      await this.tournamentService.findTournamentwithTheEarliestDate();
    const events: Event[] = await this.evenementService.findEvent();
    if (userRanking || tournament) {
      // On crée un objet qui contient les informations de l'utilisateur et du rang
      const result = {
        tournament,
        userRanking,
        events,
      };
      // Si la création réussi, on envoie un code HTTP 200.
      return response.send(result);
    } else {
      // Si la création échoue, on envoie une exception HTTP avec un code 400
      throw new HttpException('Bug dans la matrice', HttpStatus.BAD_REQUEST);
    }
  }
}
