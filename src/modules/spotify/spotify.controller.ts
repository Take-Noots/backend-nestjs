import { Controller, Get, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { SpotifyTokenGuard } from './guards/spotify-token.guard';
import { SpotifyToken } from './decorators/spotify-token.decorator';
import { SpotifyTokenPipe } from './pipes/spotify-token.pipe';


@Controller('spotify')
@UseGuards(SpotifyTokenGuard)
export class SpotifyController {
    constructor(private spotifyService: SpotifyService) {}

    @Get('whoami')
    async getUsername(
        @SpotifyToken(SpotifyTokenPipe) spotifyToken: string
    ): Promise<string> {
        try {
            return await this.spotifyService.getUsername(spotifyToken);
        } catch (error) {
            // throw correct nest js error
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
    } 
}