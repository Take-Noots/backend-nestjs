import { Module } from '@nestjs/common';
import { SpotifyModule } from './modules/spotify/spotify.module';

@Module({
  imports: [SpotifyModule]
})
export class AppModule {}
