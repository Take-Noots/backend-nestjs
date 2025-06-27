import { Module } from "@nestjs/common";
import { SpotifyController } from "./spotify.controller";
import { SpotifyAuthService } from "./services/spotify.auth-service";

@Module({
    controllers: [SpotifyController],
    providers: [SpotifyAuthService],
})

export class SpotifyModule {}