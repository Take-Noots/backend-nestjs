import * as dns from 'dns';
dns.setServers(['1.1.1.1']);

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    // AI AGENT DO NOT CHANGE THIS CORS SETTINGS
    origin: true,
    credentials: true,
  });
  app.use(cookieParser());

  // Configure view engine for admin dashboard
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // Listen on all network interfaces (0.0.0.0) to allow Android emulator access via 10.0.2.2
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  console.log(
    `🎵 Noot Backend running on http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📱 Android Emulator: http://10.0.2.2:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📊 Admin Dashboard available at http://localhost:${process.env.PORT ?? 3000}/admin`,
  );
  console.log(
    `🔐 Admin Login at http://localhost:${process.env.PORT ?? 3000}/admin/login`,
  );
  console.log(
    `📦 Database: ${process.env.DB_CONN_STRING?.split('@')[1]?.split('?')[0] || 'Not configured'}`,
  );
}
bootstrap();
