import * as dns from 'dns'
 dns.setServers(['1.1.1.1']);

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for admin dashboard
  app.enableCors({

    // origin: ['http://localhost:3000', 'http://localhost:3001'],
    origin: true,
    credentials: true,
  });
  
  // Cookie parser for admin sessions
  app.use(cookieParser());

  
  // Configure view engine for admin dashboard
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');
  
  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`🎵 Noot Backend running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📊 Admin Dashboard available at http://localhost:${process.env.PORT ?? 3000}/admin`);
  console.log(`🔐 Admin Login at http://localhost:${process.env.PORT ?? 3000}/admin/login`);
  console.log(`📦 Database: ${process.env.DB_CONN_STRING?.split('@')[1]?.split('?')[0] || 'Not configured'}`);
}
bootstrap();