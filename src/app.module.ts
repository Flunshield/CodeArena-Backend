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
import { RolesGuard } from './guards/roles.guard';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { DashboardController } from './controlleur/dashboard/dashboard.controller';
import { DashboardService } from './services/dashboard/dashboard.service';
import { TournamentController } from './controlleur/tournament/tournament.controller';
import { TournamentService } from './services/tournament/TournamentService';
import { EvenementService } from './services/evenement/evenement.service';
import { EvenementController } from './controlleur/evenement/evenement.controller';
import { AdminController } from './controlleur/admin/admin.controller';
import * as path from 'path';
import { AdminService } from './services/admin/admin.service';
import { StripeController } from './controlleur/stripe/stripe.controller';
import { StripeService } from './services/stripe/stripe.service';
import { PuzzleController } from './controlleur/puzzle/puzzle.controller';
import { PuzzleService } from './services/puzzle/puzzle.service';

@Module({
  imports: [
    EmailModule,
    I18nModule.forRoot({
      fallbackLanguage: 'fr',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['pma_lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  controllers: [
    AppController,
    UserController,
    AuthController,
    DashboardController,
    TournamentController,
    EvenementController,
    AdminController,
    StripeController,
    PuzzleController,
  ],
  providers: [
    AppService,
    UserService,
    AuthService,
    MailService,
    RefreshTokenService,
    RolesGuard,
    DashboardService,
    TournamentService,
    EvenementService,
    AdminService,
    StripeService,
    PuzzleService,
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
        { path: '/traduction', method: RequestMethod.GET },
        { path: 'auth/forgotPassWord', method: RequestMethod.POST },
        {
          path: '/stripe/create-checkout-session-premium',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
