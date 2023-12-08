import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateUserDto } from '../../dto/CreateUserDto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

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
}
