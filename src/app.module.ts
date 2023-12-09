import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './controlleur/user/user.controller';
import { UserService } from './services/user/user.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './controlleur/auth/auth.controller';
import { VerifyJwtMiddleware } from './utils/jwt-utils';
import { EmailModule } from './email/module/email.module';
import { MailService } from './email/service/MailService';

@Module({
  imports: [EmailModule],
  controllers: [AppController, UserController, AuthController],
  providers: [AppService, UserService, AuthService, MailService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyJwtMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'user/creatUser', method: RequestMethod.POST },
        { path: 'auth/validMail', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
