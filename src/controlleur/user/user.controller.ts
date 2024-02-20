import {
  Body,
  Controller,
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
import {CreateUserDto} from '../../dto/CreateUserDto';
import {UserService} from '../../services/user/user.service';
import {User} from '../../interfaces/userInterface';
import {ADMIN, ENTREPRISE, USER} from '../../constantes/contante';
import {RolesGuard} from '../../guards/roles.guard';
import {Roles} from '../auth/auth.controller';

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
     */
    constructor(private readonly userService: UserService) {
    }

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
     * const createUserDto: CreateUserDto = { ... }; // Définir les détails de l'utilisateur à créer
     * const result = await userController.create(createUserDto);
     * console.log(result);
     * ```
     */
    @Post('/creatUser')
    async create(@Body() createUserDto: CreateUserDto): Promise<HttpException> {
        const response = await this.userService.create(createUserDto);
        if (response) {
            // Si la création réussi, on envoie un code HTTP 200.
            return new HttpException('Utilisateur créé avec succès', HttpStatus.OK);
        } else {
            // Si la création échoue, on envoie une exception HTTP avec un code 400
            throw new HttpException(
                "Le nom de compte n'est pas disponnible",
                HttpStatus.BAD_REQUEST,
            );
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

    // @Post('/validMail')
    // @Roles(USER, ADMIN, ENTREPRISE)
    // @UseGuards(RolesGuard)
    // async validMail(@Body() user: User, @Req() request, @Res() response) {
    //     try {
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
}
