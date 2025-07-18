// import * as dns from 'dns'
// dns.setServers(['1.1.1.1']);

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Middleware setup
  app.use(cookieParser());
  
  // CORS configuration
  app.enableCors({
    // At this point we are not in production so no need to define specific origins
    // origin: [
    //   'http://localhost:3000',
    //   'http://localhost:3001',
    //   'http://localhost:5173',
    //   process.env.FRONTEND_URL,
    // ].filter(Boolean) as (string | RegExp)[],
    origin: true,
    credentials: true,
  });
  
  // API validation (CURRENTLY COMMENTED SO THAT WE CAN TEST THE API WITHOUT VALIDATION)
  // app.useGlobalPipes(new ValidationPipe({
  //   transform: true,
  //   whitelist: true,
  //   forbidNonWhitelisted: true,
  // }));
  
  // Admin dashboard setup
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');
  
  // Optional API prefix (excludes admin routes)
  // app.setGlobalPrefix('api', { exclude: ['/admin*'] });
  
  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`🎵 Noot Backend running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📊 Admin Dashboard: http://localhost:${process.env.PORT ?? 3000}/admin`);
  console.log(`🚀 API Endpoints: http://localhost:${process.env.PORT ?? 3000}/api`);
  console.log(`📦 Database: ${process.env.DB_CONN_STRING?.split('@')[1]?.split('?')[0] || 'Connected'}`);
}
bootstrap();