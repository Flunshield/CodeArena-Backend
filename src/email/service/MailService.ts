import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserMail } from '../../interfaces/userInterface';
import { RefreshTokenService } from '../../services/authentificationService/RefreshTokenService';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async sendActiveAccount(user: UserMail, urlActive: string): Promise<boolean> {
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

  async sendForgotPassword(
    user: UserMail,
    urlActive: string,
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Modifie ton mot de passe',
        template: 'forgot',
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
   * @param type
   * @param data - Les informations de l'utilisateur, y compris le nom d'utilisateur.
   *
   * @example
   * ```typescript
   * const id = 123;
   * const userData = { userName: 'john_doe',  ...other user data };
   * await sendMail(id, userData);
   * ```
   **/
  public async prepareMail(id: number, data: UserMail, type: number) {
    // TYPE 1 : Envoie du mail pour valdier l'adresse mail
    if (type === 1) {
      const token = await this.refreshTokenService.generateAccesTokenEmail(
        id,
        data.userName,
      );
      return await this.sendActiveAccount(
        data,
        `http://localhost:3000/auth/validMail?token=${token}`,
      );
    }

    // TYPE 2 : Envoie du mail d'oublie de mot de passe
    if (type === 2) {
      const token =
        await this.refreshTokenService.generateAccesTokenPasswordChange(
          id,
          data.userName,
        );
      return await this.sendForgotPassword(
        data,
        `http://localhost:5173/changePassword?token=${token}&userName=${data.userName}`,
      );
    }
  }
}
