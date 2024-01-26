import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { UserConnect } from '../../interfaces/userInterface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AuthService } from '../../services/authentificationService/auth.service';
import { RefreshTokenService } from '../../services/authentificationService/RefreshTokenService';
import * as cookie from 'cookie';
import { RolesGuard } from '../../guards/roles.guard';
import { ADMIN, ENTREPRISE, USER } from '../../constantes/contante';

//TODO: Ajouter une vérification au login pour l'email vérifier, si non, renvoyer un mail de validation

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Contrôleur pour gérer les opérations d'authentification.
 *
 * @public
 */
@Controller('auth')
export class AuthController {
  /**
   * Crée une nouvelle instance de AuthController.
   *
   * @param AuthService
   * @param refreshTokenService
   */
  constructor(
    private readonly AuthService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  /**
   * Gère la demande de connexion en appelant le service utilisateur pour authentifier les informations d'identification fournies.
   *
   * @param userLogin - Les informations d'identification de l'utilisateur à connecter.
   * @param request - L'objet de requête Express.
   * @param response - L'objet de réponse Express.
   * @returns Un refreshToken
   *
   * @throws HttpException - En cas d'erreur lors de la connexion.
   */
  @Post('/login')
  async login(
    @Body() userLogin: UserConnect,
    @Req() request,
    @Res({ passthrough: true }) response,
  ) {
    try {
      const frenchCodeAreaCookie = request.cookies['frenchcodeareatoken'];
      const reponse = await this.AuthService.connect(
        userLogin,
        response,
        frenchCodeAreaCookie,
      );
      if (reponse === HttpStatus.OK) {
        return response.status(HttpStatus.OK).send('Connecté');
      } else {
        throw new HttpException(
          `Erreur de connexion : ${reponse}`,
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, status);
    }
  }

  /**
   * Endpoint pour rafraîchir le jeton d'accès.
   *
   * @param request - L'objet de requête Express.
   * @param response - L'objet de réponse Express.
   * @returns void
   *
   * @remarks
   * Cette fonction utilise le jeton de rafraîchissement extrait des cookies de la requête
   * pour générer un nouveau jeton d'accès à l'aide du service de rafraîchissement de jeton.
   * Le nouveau jeton d'accès est renvoyé dans la réponse.
   *
   * @example
   * // Exemple d'utilisation dans un contrôleur Express
   * @Post('refresh-access-token')
   * refreshAccessToken(@Req() request, @Res() response): void {
   *   const refreshToken = request.cookies.frenchcodeareatoken;
   *   const accessToken =
   *     this.refreshTokenService.generateAccessTokenFromRefreshToken(refreshToken);
   *   response.send(accessToken);
   * }
   */
  @Post('refresh-access-token')
  async refreshAccessToken(@Req() request, @Res() response): Promise<void> {
    try {
      const refreshToken = request.cookies['frenchcodeareatoken'];
      const accessToken =
        await this.refreshTokenService.generateAccessTokenFromRefreshToken(
          refreshToken,
        );
      response.send({ accessToken: accessToken });
    } catch (error: any) {
      console.error("Erreur lors de la récupération de l'accesToken :", error);
      throw new HttpException('Merci de vous authentifier', error.HttpStatus);
    }
  }

  /**
   * Déconnecte l'utilisateur en supprimant le cookie de rafraîchissement.
   *
   * @param request - L'objet de requête express.
   * @param response - L'objet de réponse express.
   * @returns Une promesse résolue lorsque la déconnexion est effectuée avec succès.
   *
   * @throws {HttpException} - Erreur interne du serveur en cas d'échec de la déconnexion.
   *
   * @remarks
   * Cette méthode gère la déconnexion en supprimant le cookie de rafraîchissement côté serveur.
   * Elle renvoie une réponse confirmant la suppression du cookie.
   *
   * @example
   * ```typescript
   * await logout(request, response);
   * ```
   *
   * @public
   */
  @Post('logout')
  async logout(@Req() request, @Res() response): Promise<void> {
    try {
      const refreshToken = request.cookies['frenchcodeareatoken'];
      if (refreshToken) {
        const nomDuCookie = 'frenchcodeareatoken';

        // Suppression du cookie côté serveur
        response.setHeader(
          'Set-Cookie',
          cookie.serialize(nomDuCookie, '', {
            httpOnly: true,
            maxAge: 0,
            domain: 'localhost', // Assurez-vous de spécifier le même chemin que celui utilisé pour définir le cookie
          }),
        );

        // Envoyez une réponse pour confirmer la suppression du cookie
        response.send('Cookie supprimé avec succès');
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération de l'accesToken :", error);
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Endpoint pour la validation de l'adresse e-mail.
   *
   * @param token - Le jeton à utiliser pour la validation de l'adresse e-mail.
   * @param response - Renvoie vers l'url approprié
   *
   * @returns Une réponse HTTP représentant le statut de validation de l'adresse e-mail.
   *
   * @throws {HttpException} - Erreur interne du serveur en cas d'échec de la validation.
   *
   * @remarks
   * Cette méthode permet de valider une adresse e-mail en utilisant un jeton spécifique.
   * Elle renvoie le statut de la validation de l'adresse e-mail.
   *
   * @example
   * ```typescript
   * await validMail('votre_token', response);
   * ```
   *
   * @public
   */
  @Get('/validMail')
  async validMail(@Query('token') token: string, @Res() response) {
    try {
      const validMail: HttpStatus = await this.AuthService.validMail(token);
      if (validMail === 200) {
        response.redirect('http://localhost:5173/login');
      } else {
        response.redirect('http://localhost:5173/notFound');
      }
    } catch (error: any) {
      console.error("Erreur lors de la création de l'utilisateur :", error);
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cette fonction permet à l'utilisateur de vérifier son email à sa demande.
   * @param request
   * @param response
   */
  @Get('verifyMail')
  @Roles(USER, ADMIN, ENTREPRISE)
  @UseGuards(RolesGuard)
  async verifyMail(@Req() request, @Res() response) {
    try {
      const accesToken = request.headers.authorization;
      if (accesToken) {
        const token = accesToken.split(' ')[1];

        try {
          await this.AuthService.validMail(token);
          response.send();
        } catch (error) {
          console.log(error);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Post('forgotPassWord')
  async forgotPassWord(@Req() request, @Res() response) {
    try {
      const email = request.body.email;
      try {
        await this.AuthService.passwordForgot(email);
        response.send();
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Post('/changePassword')
  async changePassword(@Req() request, @Res() response) {
    const data = request.body;
    try {
      await this.AuthService.changePassword(data);
      response.send();
    } catch (error: any) {
      console.error("Erreur lors de la création de l'utilisateur :", error);
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
