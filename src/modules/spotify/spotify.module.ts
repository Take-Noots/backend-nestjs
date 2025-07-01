import { Module } from "@nestjs/common";
import { SpotifyController } from "./spotify.controller";
import { SpotifyAuthService } from "./services/spotify.auth-service";
import { SpotifySearchService } from "./services/spotify.search-service";

@Module({
    controllers: [SpotifyController],
    providers: [SpotifyAuthService, SpotifySearchService],
})

export class SpotifyModule {}