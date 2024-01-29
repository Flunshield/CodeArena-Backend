import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { Event } from '../../interfaces/userInterface';

@Controller('dashboard')
export class DashboardController {
  /**
   * Crée une instance du contrôleur Dashboard.
   *
   * @param dashboardService
   */
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/checkDashboard')
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
      await this.dashboardService.findTournamentwithTheEarliestDate();
    const events: Event[] = await this.dashboardService.findEvent();
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
