import * as dns from 'dns';
dns.setServers(['8.8.8.8']);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); 
  app.enableCors({
    origin: true,
    credentials: true, 
  });
  app.useGlobalPipes(new ValidationPipe());
  // app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
