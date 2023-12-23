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
import { AuthService } from './services/authentificationService/auth.service';
import { AuthController } from './controlleur/auth/auth.controller';
import { VerifyJwtMiddleware } from './midleWare/jwt-utils';
import { EmailModule } from './email/module/email.module';
import { MailService } from './email/service/MailService';
import { RefreshTokenService } from './services/authentificationService/RefreshTokenService';

@Module({
  imports: [EmailModule],
  controllers: [AppController, UserController, AuthController],
  providers: [
    AppService,
    UserService,
    AuthService,
    MailService,
    RefreshTokenService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyJwtMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/logout', method: RequestMethod.POST },
        { path: 'auth/refresh-access-token', method: RequestMethod.POST },
        { path: 'user/creatUser', method: RequestMethod.POST },
        { path: 'auth/validMail', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
