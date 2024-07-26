/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Dto } from '../../dto/./Dto';
import { UserService } from '../../services/user/user.service';
import { ResponseCreateUser, User } from '../../interfaces/userInterface';
import { ADMIN, ENTREPRISE, USER } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../auth/auth.controller';
import { MailService } from '../../email/service/MailService';
import { StripeService } from "../../services/stripe/stripe.service";

/**
 * Contrôleur responsable de la gestion des utilisateurs.
 *
 * @remarks
 * Ce contrôleur expose des points de terminaison pour créer et gérer les utilisateurs.
 *
 * @example
 * ```typescript
 * // Exemple d'utilisation dans un autre module NestJS
 * const userController = new UserController(userService);
 * await userController.create(createUserDto);
 * ```
 */
@Controller('user')
export class UserController {
  /**
   * Crée une instance du contrôleur utilisateur.
   *
   * @param userService - Le service utilisateur utilisé pour gérer les opérations liées aux utilisateurs.
   * @param mailService
   * @param stripeService
   */
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly stripeService: StripeService
  ) {}

  /**
   * Point de terminaison pour la création d'un nouvel utilisateur.
   *
   * @param createUserDto - Les données du nouvel utilisateur à créer.
   * @returns Une promesse résolue avec une exception HTTP en cas de succès ou d'échec de la création.
   * @throws {HttpException} Une exception HTTP avec un code approprié en cas d'échec.
   *
   * @example
   * ```typescript
   * // Exemple d'appel du point de terminaison de création d'utilisateur
   * const createUserDto: Dto = { ... }; // Définir les détails de l'utilisateur à créer
   * const result = await userController.create(createUserDto);
   * console.log(result);
   * ```
   */
  @Post('/creatUser')
  async create(@Body() createUserDto: Dto): Promise<HttpException> {
    const response: ResponseCreateUser =
      await this.userService.create(createUserDto);
    if (response.bool && response.type === 'ok') {
      // Si la création réussi, on envoie un code HTTP 200.
      return new HttpException('Utilisateur créé avec succès', HttpStatus.OK);
    } else {
      if (!response.bool && response.type === 'username') {
        // Si la création échoue, on envoie une exception HTTP avec un code 400
        throw new HttpException(
          "Le nom de compte ou l'adresse mail n'est pas disponnible",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!response.bool && response.type === 'password') {
        // Si la création échoue, on envoie une exception HTTP avec un code 400
        throw new HttpException(
          'Mot de passe invalide. Il doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre, un caractère spécial et faire au moins 8 caractères.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  @Get('/getUsers')
  @Roles(ADMIN, ENTREPRISE, USER)
  @UseGuards(RolesGuard)
  async getUsers(@Query('page') page: string, @Query('itemPerPage') itemPerPage: string, @Query('isEntreprise') isEntreprise: string, @Query('languagePreference') languagePreference: string, @Req() request, @Res() response) {
    try {
      const users = await this.userService.getUsers(parseInt(page), parseInt(itemPerPage), isEntreprise, languagePreference);
      response.send(users);
    } catch (error) {
      console.log(error);
    }
  }

  @Get('/getUsersByUsername')
  @Roles(ADMIN, ENTREPRISE, USER)
  @UseGuards(RolesGuard)
  async getUsersByUsername(@Query('username') username: string, @Query('itemPerPage') itemPerPage: string, @Query('isEntreprise') isEntreprise: string, @Req() request, @Res() response) {
    try {
      const users = await this.userService.getUsersByUserName(username.toString(), parseInt(itemPerPage), isEntreprise);
      response.send(users);
    } catch (error) {
      console.log(error);
    }
  }

  @Get('/getUser')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async getUser(@Query('id') id: string, @Query('isEntreprise') isEntreprise: string, @Query('username') username: string,  @Req() request, @Res() response) {
    try {
      const testEntreprise = isEntreprise === 'true' ? true : false;

      if(testEntreprise) {
        const user = await this.userService.getUserByUserName(username.toString());
        response.send(user);
      } else {
      const user = await this.userService.getUserById(parseInt(id));
      response.send(user);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Patch('/updateUser')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async update(@Body() user: User): Promise<HttpException> {
    const response = await this.userService.update(user);
    if (response === HttpStatus.OK) {
      // Si la création réussi, on envoie un code HTTP 200.
      return new HttpException('Utilistaeur mis à jour', HttpStatus.OK);
    } else {
      // Si la création échoue, on envoie une exception HTTP avec un code 400
      throw new HttpException('Utilistaeur inconnu', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/getTitles')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async getTitles(@Req() request, @Res() response) {
    try {
      const titles = await this.userService.getTitles();
      response.send(titles);
    } catch (error) {
      console.log(error);
    }
  }

  @Get('/getUserRanking')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async getUserRanking(
    @Query('userName') userName: string,
    @Req() request,
    @Res() response,
  ) {
    try {
      let users;
      if (userName) {
        // Si userName n'est pas vide, appeler la fonction avec userName
        users = await this.userService.getUserRanked(userName);
      } else {
        // Si userName est vide, appeler la fonction sans userName
        users = await this.userService.getUserRanked();
      }
      response.send(users);
    } catch (error) {
      console.log(error);
    }
  }

  @Post('/validMail')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async validMail(@Body() data: any, @Req() request, @Res() response) {
    const user = data.data;
    await this.mailService.prepareMail(user.id, user, 1);
    response.send();
  }

  @Get('/lastCommande')
  @Roles(ENTREPRISE, ADMIN)
  @UseGuards(RolesGuard)
  async findLastCommande(
    @Query('id') id: string,
    @Req() request,
    @Res() response,
  ) {
    try {
      const lastCommande = await this.stripeService.getLastCommande(id);
      if (lastCommande === null) {
        response.send({ message: 'Aucune commande trouvée' });
      } else {
        response.send(lastCommande);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Post('createCv')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async createCv(@Body() data: any, @Req() request, @Res() response) {
    try {
      const nbCv = await this.userService.getNbCv(data.data.userId);
      if(nbCv <= 4) {
      const createCv = await this.userService.createCv(data.data);
      if (createCv) {
      response.send(createCv);
      }
    } else {
      response.send({message: 'Vous avez atteint le nombre maximal de cv', status: 400});
    }
    } catch (error) {
      console.log(error);
    }
  }

  @Get('getCv')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async getCv(@Query('id') id: string, @Req() request, @Res() response) {
    try {
      const cv = await this.userService.getCv(id);
      if(cv) {
        response.send(cv);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Delete('deleteCv')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async deleteCv(@Req() request, @Res() response, @Body() data: any) {
    try {
      const deleteCv = await this.userService.deleteCv(data.idElementToDelete, data.userId);
      if(deleteCv) {
        response.send(deleteCv);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Get('pdfCvUser')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async cvUser(@Query('id') id: string, @Query('idCv') idCv: string, @Req() request, @Res() response) {
    try {
      const cv = await this.userService.generateCvPDF(id, false, "", idCv);
      if(cv) {
        response.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'Content-Disposition; filename=cv.pdf',
          'Content-Length': cv.length,
        });
        response.end(cv);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Post('activateCv')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async activateCv(@Body() data: any, @Req() request, @Res() response) {
    try {
      const activateCv = await this.userService.activateCv(data.data.idElementToActivate, data.data.userId);
      if(activateCv) {
        response.send(activateCv);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
