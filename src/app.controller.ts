import { Controller, Get } from '@nestjs/common';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';

@Controller('/')
export class AppController {
  constructor(private readonly i18n: I18nService) {}
  @Get('/traduction')
  async getI18nHello(@I18n() i18n: I18nContext) {
    return i18n.t('traduction');
  }
}
