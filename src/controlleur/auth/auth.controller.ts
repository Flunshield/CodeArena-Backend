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
import { shortUser } from '../../interfaces/userInterface';
import { AuthService } from '../../services/authentificationService/auth.service';
import { RefreshTokenService } from '../../services/authentificationService/RefreshTokenService';
import { RolesGuard } from '../../guards/roles.guard';
import { ADMIN, ENTREPRISE, USER } from '../../constantes/contante';

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
   * @param authService
   * @param refreshTokenService
   */
  constructor(
    private readonly authService: AuthService,
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
  async login(@Body() userLogin: shortUser, @Req() request, @Res() response) {
    try {
      const frenchCodeAreaCookie = request.cookies['frenchcodeareatoken'];
      const reponse = await this.authService.connect(
        userLogin,
        response,
        frenchCodeAreaCookie,
      );
      // Ajout du setTimeout pour les bruteForce sur la connexion.
      setTimeout(() => {
        if (reponse !== 500) {
          return response.status(HttpStatus.OK).send({ message: reponse });
        } else {
          return response.status(HttpStatus.NOT_FOUND).send();
        }
      }, 1000);
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
    let refreshToken = request.cookies['frenchcodeareatoken'];
    try {
      const accessToken =
        await this.refreshTokenService.generateAccessTokenFromRefreshToken(
          refreshToken,
        );
      refreshToken = accessToken;
      if (!accessToken) {
        response
          .status(HttpStatus.UNAUTHORIZED)
          .send({ message: 'Unauthorized' });
      } else {
        response.send({ accessToken: accessToken });
      }
    } catch (error: any) {
      throw new HttpException(
        `Merci de vous authentifier ${refreshToken}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
        // Suppression du cookie côté serveur
        response.clearCookie('frenchcodeareatoken', {
          path: '/', // accessible from the entire domain
          domain: process.env.DOMAINE, // parent domain
          secure: true, // cookie accessible via HTTPS only
          httpOnly: true, // cookie accessible via HTTP only, not JavaScript
          sameSite: 'none', // 'None' avec une majuscule pour respecter la syntaxe du SameSite
        });

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
      const validMail: HttpStatus = await this.authService.validMail(token);
      if (validMail === 200) {
        response.redirect(`${process.env.URL_FRONT}/login`);
      } else {
        response.redirect(`${process.env.URL_FRONT}/notFound`);
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
          const validMail = await this.authService.validMail(token);
          if (validMail) {
            response.send();
          } else {
            response.send();
          }
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
        await this.authService.passwordForgot(email);
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
      await this.authService.changePassword(data);
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
