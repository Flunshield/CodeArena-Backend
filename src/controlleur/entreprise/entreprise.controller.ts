import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/auth.controller';
import { ADMIN, ENTREPRISE } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { EntrepriseService } from '../../services/entreprise/entreprise.service';
import { PuzzleService } from '../../services/puzzle/puzzle.service';

@Controller('entreprise')
export class EntrepriseController {
  constructor(
    private readonly entrepriseService: EntrepriseService,
    private readonly puzzleService: PuzzleService,
  ) {}

  @Post('/sendPuzzle')
  @Roles(ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async createPuzzle(@Body() data, @Req() request, @Res() response) {
    try {
      const dataReceive = data.data;
      dataReceive.puzzle = await this.puzzleService.findOnePuzzle(
        dataReceive.idPuzzle,
      );
      const sendEmail =
        await this.entrepriseService.sendEmailPuzzle(dataReceive);
      response.send(sendEmail);
    } catch (error) {
      console.log(error);
    }
  }
}
