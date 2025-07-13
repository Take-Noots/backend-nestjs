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
    origin: [
      'http://localhost:3000',  // Backend
      'http://localhost:3001',  // Admin dashboard (if separate)
      'http://localhost:5173',  // Vite frontend
      process.env.FRONTEND_URL, // Production frontend
    ].filter(Boolean),
    credentials: true,
  });
  
  // API validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
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