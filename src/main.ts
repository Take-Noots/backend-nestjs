import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { config } from 'dotenv';

async function bootstrap() {
  console.log(process.env.DB_CONN_STRING);
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); 
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
