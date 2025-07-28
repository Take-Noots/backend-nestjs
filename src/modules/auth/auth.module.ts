// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@modules/user/user.module';
import { SpotifyModule } from '@modules/spotify/spotify.module';

@Module({
  imports: [UserModule, SpotifyModule], 
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})

export class AuthModule {}