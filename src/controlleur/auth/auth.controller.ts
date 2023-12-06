import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { UserConnect } from '../../interfaces/userInterface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AuthService } from '../../services/auth.service';

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
  async login(@Body() userLogin: UserConnect, @Req() request, @Res() response) {
    response.send(await this.AuthService.connect(userLogin, response, request));
  }
  catch(error: any): void {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    throw new HttpException(
      'Erreur interne du serveur',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
