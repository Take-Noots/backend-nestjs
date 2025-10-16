import { Module } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose';
import { SpotifyController } from "./spotify.controller";
import { SpotifyAuthService } from "./services/spotify.auth-service";
import { SpotifySearchService } from "./services/spotify.search-service";
import { SpotifySessionService } from '@modules/spotify/services/spotify.session-service';
import { SpotifyPlayerService } from './services/spotify.player-service';
import { SpotifyUserService } from './services/spotify.user-service';
import { SpotifySession, SpotifySessionSchema } from './spotify.model';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SpotifySession.name, schema: SpotifySessionSchema },
        ]),
    ],
    controllers: [SpotifyController],
    providers: [SpotifyAuthService, SpotifySearchService, SpotifySessionService, SpotifyPlayerService, SpotifyUserService],
    exports: [SpotifySessionService, SpotifyPlayerService, SpotifyUserService],
})

export class SpotifyModule {}