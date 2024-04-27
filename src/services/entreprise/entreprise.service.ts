import { Injectable } from '@nestjs/common';
import { MailService } from '../../email/service/MailService';

@Injectable()
export class EntrepriseService {
  constructor(private readonly mailService: MailService) {}

  async sendEmailPuzzle(data) {
    return await this.mailService.prepareMail(null, data, 3);
  }
}
