import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/auth.controller';
import { ADMIN, ENTREPRISE, INVITE } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { EntrepriseService } from '../../services/entreprise/entreprise.service';
import { PuzzleService } from '../../services/puzzle/puzzle.service';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

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
      const sendEmail =
        await this.entrepriseService.sendEmailPuzzle(dataReceive);
      response.send(sendEmail);
    } catch (error) {
      console.log(error);
    }
  }

  @Get('/puzzleGame')
  @Roles(INVITE)
  @UseGuards(RolesGuard)
  async findPuzzleForTest(
    @Query('token') token: string,
    @Req() request,
    @Res() response,
  ) {
    try {
      const publicKey = fs.readFileSync('public_key.pem', 'utf-8');
      const decodedToken = jwt.verify(token, publicKey);

      const puzzle = await this.puzzleService.findPuzzleForGame(decodedToken);
      if (puzzle === null) {
        response.send(HttpStatus.NOT_FOUND);
      }
      response.send(puzzle);
    } catch (error) {
      response.send(HttpStatus.BAD_REQUEST);
      console.log(error);
    }
  }

  @Post('/puzzleGame')
  @Roles(INVITE)
  @UseGuards(RolesGuard)
  async sendPuzzleAfterGame(@Body() data, @Req() request, @Res() response) {
    try {
      const result = await this.puzzleService.updatePuzzleAfterGame(data.data);
      if (result === null) {
        response.send(HttpStatus.NOT_FOUND);
      } else {
        response.send(result);
      }
    } catch (error) {
      response.send(HttpStatus.BAD_REQUEST);
      console.log(error);
    }
  }

  @Get('/getPuzzlePlaying')
  @Roles(ENTREPRISE, ADMIN)
  @UseGuards(RolesGuard)
  async getPuzzlePlaying(
    @Query('id') id: string,
    @Query('page') page: number,
    @Req() request,
    @Res() response,
  ) {
    try {
      const result = await this.puzzleService.getPuzzlePlaying(id, page);
      response.send(result);
    } catch (error) {
      response.status(HttpStatus.BAD_REQUEST).send();
      console.log(error);
    }
  }
}
