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
import { StripeService } from '../../services/stripe/stripe.service';
import { UserService } from '../../services/user/user.service';

@Controller('entreprise')
export class EntrepriseController {
  constructor(
    private readonly entrepriseService: EntrepriseService,
    private readonly puzzleService: PuzzleService,
    private readonly stripeService: StripeService,
    private readonly userService: UserService,
  ) {}

  @Post('/sendPuzzle')
  @Roles(ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async createPuzzle(@Body() data, @Req() request, @Res() response) {
    try {
      const dataReceive = data.data;
      const canSendMail =
        await this.userService.getIfUSerCanSendMailEntreprise(dataReceive);

      if (canSendMail) {
        const sendEmail =
          await this.entrepriseService.sendEmailPuzzle(dataReceive);
        response.send(sendEmail);
      } else {
        response.status(HttpStatus.BAD_REQUEST).send();
      }
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
    @Query('title') title: string,
    @Query('ascending') ascending: string,
    @Query('puzzleCheck') puzzleCheck: string,
    @Req() request,
    @Res() response,
  ) {
    try {
      const result = await this.puzzleService.getPuzzlePlaying(
        id,
        page,
        title,
        ascending,
        puzzleCheck,
      );
      response.send(result);
    } catch (error) {
      response.status(HttpStatus.BAD_REQUEST).send();
      console.log(error);
    }
  }

  @Post('/unsuscribe')
  @Roles(ENTREPRISE)
  @UseGuards(RolesGuard)
  async unsuscribe(@Body() data) {
    const userId = data.data.userId;
    const lastCommande = await this.stripeService.getLastCommande(userId);
    return await this.stripeService.unsuscribeUser(lastCommande);
  }

  @Get('/getAllCommandeForUser')
  @Roles(ENTREPRISE, ADMIN)
  @UseGuards(RolesGuard)
  async getAllCommandeForUser(
    @Query('id') id: string,
    @Query('page') page: number,
  ) {
    return await this.entrepriseService.getAllCommandeForUser(id, page);
  }

  @Get('pdfCvUser')
  @Roles(ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async cvUser(
    @Query('id') id: string,
    @Query('userId') userId: string,
    @Req() request,
    @Res() response,
  ) {
    try {
      const cv = await this.entrepriseService.generateCvPDFForEntreprise(
        id,
        userId,
      );
      if (cv) {
        response.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'Content-Disposition; filename=invoice.pdf',
          'Content-Length': cv.length,
        });
        response.end(cv);
      }
    } catch (error) {
      response.status(500).send('Error generating CV');
    }
  }

  @Get('getUserEntreprise')
  @Roles(ADMIN)
  @UseGuards(RolesGuard)
  async getUserEntreprise(@Query('userName') userName: string) {
    return await this.entrepriseService.getUserEntreprise(userName);
  }

  @Get('getCommande')
  @Roles(ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async getCommande(@Query('id') id: string, @Query('userId') userId: string) {
    return await this.entrepriseService.getCommande(id, userId);
  }
}
