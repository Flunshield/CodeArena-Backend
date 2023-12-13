import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { UserConnect } from '../../interfaces/userInterface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AuthService } from '../../services/authentificationService/auth.service';
import { RefreshTokenService } from '../../services/authentificationService/RefreshTokenService';

//TODO: Implémenter le refreshToken.

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
      const frenchCodeAreaCookie = request?.cookies?.frenchcodeareatoken;
      const reponse = await this.AuthService.connect(
        userLogin,
        response,
        frenchCodeAreaCookie,
      );
      response.send(reponse);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        return response.status(404).json({ message: error.message });
      }
      console.error("Erreur lors de la connection de l'utilisateur :", error);
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
  refreshAccessToken(@Req() request, @Res() response): void {
    try {
      const refreshToken = request.cookies.frenchcodeareatoken;
      const accessToken =
        this.refreshTokenService.generateAccessTokenFromRefreshToken(
          refreshToken,
        );
      response.send(accessToken);
    } catch (error: any) {
      console.error("Erreur lors de la récupération de l'accesToken :", error);
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /*
   * Ne fonctionne pas pour le moment
   */
  @Get('/validMail')
  async validMail(
    @Query('id') id: number,
    @Query('userName') userName: string,
    @Res() response,
  ) {
    const test = await this.AuthService.validMail(userName, id);
    response.send(test);
  }
  catch(error: any): void {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    throw new HttpException(
      'Erreur interne du serveur',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
