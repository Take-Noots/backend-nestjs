import { Module } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose';
import { SpotifyController } from "./spotify.controller";
import { SpotifyAuthService } from "./services/spotify.auth-service";
import { SpotifySearchService } from "./services/spotify.search-service";
import { SpotifySessionService } from './services/spotify.session-service';
import { SpotifyPlayerService } from './services/spotify.player-service';
import { SpotifySession, SpotifySessionSchema } from './spotify.model';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SpotifySession.name, schema: SpotifySessionSchema },
        ]),
    ],
    controllers: [SpotifyController],
    providers: [SpotifyAuthService, SpotifySearchService, SpotifySessionService, SpotifyPlayerService],
})

export class SpotifyModule {}