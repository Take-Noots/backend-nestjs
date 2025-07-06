import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpotifyModule } from './modules/spotify/spotify.module';
import { AuthModule } from './modules/auth/auth.module';
import { SongPostModule } from './modules/songPost/songPost.module';
import 'dotenv/config';

const dbUrl: string = process.env.DB_CONN_STRING as string;

@Module({
  imports: [
    MongooseModule.forRoot(dbUrl),
    SpotifyModule, 
    AuthModule,
    SongPostModule
  ]
})
export class AppModule {}
