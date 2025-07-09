// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for admin dashboard
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Add your frontend URLs
    credentials: true,
  });
  
  // Cookie parser for admin sessions
  app.use(cookieParser());
  
  // Serve static files for admin dashboard (remove prefix)
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`🎵 Noot Backend running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📊 Admin Dashboard available at http://localhost:${process.env.PORT ?? 3000}/admin`);
  console.log(`📦 Database: ${process.env.DB_CONN_STRING?.split('@')[1]?.split('?')[0] || 'Not configured'}`);
}
bootstrap();