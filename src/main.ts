import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: true, // ou true pour permettre à tous les domaines
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // autoriser les cookies et les en-têtes d'autorisation
  });
  await app.listen(3000);
}
bootstrap();
