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
} from '@nestjs/common';
import { UserConnect } from '../../interfaces/userInterface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AuthService } from '../../services/auth.service';

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
   */
  constructor(private readonly AuthService: AuthService) {}
  /**
   * Gère la demande de connexion en appelant le service utilisateur pour authentifier les informations d'identification fournies.
   *
   * @param userLogin - Les informations d'identification de l'utilisateur à connecter.
   * @param request - L'objet de requête Express.
   * @param response - L'objet de réponse Express.
   * @returns Une réponse envoyée par le service utilisateur après la tentative de connexion.
   *
   * @throws HttpException - En cas d'erreur lors de la connexion.
   */
  @Post('/login')
  async login(
    @Body() userLogin: UserConnect,
    @Req() request,
    @Res({ passthrough: true }) response,
  ) {
    const frenchCodeAreaCookie = request.cookies.frenchcodeareatoken;
    const loginResult = await this.AuthService.connect(
      userLogin,
      response,
      frenchCodeAreaCookie,
    );
    response.send(loginResult);
  }

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
