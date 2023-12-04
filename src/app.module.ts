import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './controlleur/user/user.controller';
import { UserService } from './services/user/user.service';
import { AuthService } from './services/auth.service';

@Module({
  imports: [],
  controllers: [AppController, UserController],
  providers: [AppService, UserService, AuthService],
})
export class AppModule {}
