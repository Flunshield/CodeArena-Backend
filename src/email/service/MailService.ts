import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateUserDto } from '../../dto/CreateUserDto';
import { User } from '../../interfaces/userInterface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RefreshTokenService } from '../../services/authentificationService/RefreshTokenService';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly RefreshTokenService: RefreshTokenService,
  ) {}

  async sendActiveAccount(
    user: CreateUserDto,
    urlActive: string,
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Active ton compte',
        template: 'active',
        context: {
          urlActive: urlActive,
          userName: user.userName,
        },
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'e-mail : ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Envoie un e-mail d'activation de compte à l'utilisateur avec les informations spécifiées.
   *
   * @param id - L'identifiant numérique associé à l'utilisateur.
   * @param data - Les informations de l'utilisateur, y compris le nom d'utilisateur.
   * @returns Une promesse qui se résout lorsque l'e-mail a été envoyé avec succès.
   * @throws {Error} Une erreur est levée si la génération du jeton d'accès échoue ou si l'envoi de l'e-mail échoue.
   *
   * @remarks
   * Cette fonction génère un jeton d'accès en utilisant la fonction `generateAccessTokenEmail`
   * du service de rafraîchissement de jeton (`RefreshTokenService`).
   * Le lien d'activation dans l'e-mail contient le jeton généré et pointe vers l'URL spécifiée.
   *
   * @param id - L'identifiant numérique associé à l'utilisateur.
   * @param data - Les informations de l'utilisateur, y compris le nom d'utilisateur.
   *
   * @example
   * ```typescript
   * const id = 123;
   * const userData = { userName: 'john_doe',  ...other user data };
   * await sendMail(id, userData);
   * ```
   **/
  public async prepareMail(id: number, data: User) {
    const token = await this.RefreshTokenService.generateAccesTokenEmail(
      id,
      data.userName,
    );

    return await this.sendActiveAccount(
      data,
      `http://localhost:3000/auth/validMail?token=${token}`,
    );
  }
}
