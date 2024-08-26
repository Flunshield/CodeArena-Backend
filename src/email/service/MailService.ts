import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { RefreshTokenService } from '../../services/authentificationService/RefreshTokenService';
import { PrismaClient } from '@prisma/client';
import { User } from 'src/interfaces/userInterface';

const prisma = new PrismaClient();

interface Mail {
  email?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  commentaire?: string;
  idPuzzle?: string;
  pdfBuffer?: Promise<Buffer>;
}
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async sendActiveAccount(data: Mail, urlActive: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Active ton compte',
        template: 'active',
        context: {
          urlActive: urlActive,
          userName: data.userName,
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

  async sendForgotPassword(data: Mail, urlActive: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Modifie ton mot de passe',
        template: 'forgot',
        context: {
          urlActive: urlActive,
          userName: data.userName,
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

  async sendPuzzleToUser(data: Mail, urlActive: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Puzzle de test',
        template: 'puzzleTest',
        context: {
          urlActive: urlActive,
          firstName: data.firstName,
          lastName: data.lastName,
          commentaire: data.commentaire,
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
   * @param mailID
   * @example
   * ```typescript
   * const id = 123;
   * const userData = { userName: 'john_doe',  ...other user data };
   * await sendMail(id, userData);
   * ```
   **/
  public async prepareMail(
    id?: number,
    data?: Mail,
    type?: number,
    mailID?: number,
  ) {
    // TYPE 1 : Envoie du mail pour valider l'adresse mail.
    if (type === 1) {
      const token = await this.refreshTokenService.generateAccesTokenEmail({
        id: id,
        userName: data.userName,
      });
      return await this.sendActiveAccount(
        data,
        `${process.env.URL_BACK}/auth/validMail?token=${token}`,
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
        `${process.env.URL_FRONT}/changePassword?token=${token}&userName=${data.userName}`,
      );
    }

    // TYPE 3 : Envoie d'un puzzle par mail
    if (type === 3) {
      const token = await this.refreshTokenService.generateAccesTokenEmail(
        { puzzleID: data.idPuzzle, mailID: mailID },
        '7d',
      );
      return await this.sendPuzzleToUser(
        data,
        `${process.env.URL_FRONT}/loadGame?token=${token}`,
      );
    }

    // TYPE 4 : Envoie d'un mail de confirmation d'achat avec facture
    if (type === 4) {
      return await this.sendConfirmationOrder(data);
    }

    if (type === 5) {
      // TYPE 5 : Envoie du mail pour l'annulation d'abonnement
      return await this.sendCancelSubscription(data);
    }
  }

  async sendCancelSubscription(data: Mail) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: "Annulation de l'abonnement",
        template: 'cancelSubscription',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
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

  async registerMail(data) {
    try {
      const userID = parseInt(data.userID);
      const puzzlesEntrepriseId = parseInt(data.idPuzzle);
      const registerMail = await prisma.puzzleSend.create({
        data: {
          userID: userID, // L'ID de l'utilisateur
          puzzlesEntrepriseId: puzzlesEntrepriseId, // L'ID du puzzle entreprise
          sendDate: new Date(), // La date d'envoi, assurée de passer un objet Date
          firstName: data.firstName, // Prénom de l'utilisateur à qui le puzzle est envoyé
          lastName: data.lastName, // Nom de famille de l'utilisateur
          email: data.email, // Email de l'utilisateur
          commentaire: data.commentaire, // Commentaire optionnel
        },
      });

      // Logique pour envoyer le mail, supposant qu'une fonction `sendMail` est définie ailleurs
      if (registerMail) {
        return await this.prepareMail(null, data, 3, registerMail.id);
      } else {
        return HttpStatus.NOT_FOUND;
      }
    } catch (error) {
      console.error('Error in registerMail:', error);
      throw error; // Rethrow the error for further handling if necessary
    }
  }

  async sendConfirmationOrder(data: Mail): Promise<boolean> {
    try {
      // Attendre la résolution de la promesse pour obtenir le Buffer
      const pdfBuffer = await data.pdfBuffer;

      await this.mailerService.sendMail({
        to: data.email,
        subject: "Confirmation d'achat",
        template: 'confirmOrder',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
        attachments: [
          {
            filename: 'facture.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'e-mail : ${error.message}`,
        error.stack,
      );
    }
  }

  async sendDevisByEmail(user: User, devis: Buffer) {
    try {
      const devisBuffer = await devis;
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Devis',
        template: 'sendDevis',
        context: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
        attachments: [
          {
            filename: 'devis.pdf',
            content: devisBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'e-mail : ${error.message}`,
        error.stack,
      );
    }
  }
  async sendFactureByEmail(user: User, facture: unknown) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Facture',
        template: 'sendFacture',
        context: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
        attachments: [
          {
            filename: 'facture.pdf',
            content: facture,
            contentType: 'application/pdf',
          },
        ],
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'e-mail : ${error.message}`,
        error.stack,
      );
    }
  }
}
