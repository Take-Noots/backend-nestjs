// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@modules/user/user.module';
import { SpotifySessionService } from '@modules/spotify/services/spotify.session-service';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService, SpotifySessionService],
  exports: [AuthService, SpotifySessionService], // Export SpotifySessionService
})
export class AuthModule {}