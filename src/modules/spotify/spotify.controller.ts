import { Controller, Get, HttpException, BadRequestException, HttpStatus, UseGuards, Query, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { SpotifyAuthService } from './services/spotify.auth-service';
import { SpotifyTokenGuard } from './guards/spotify-token.guard';
import { SpotifyToken } from './decorators/spotify-token.decorator';
import { SpotifyTokenPipe } from './pipes/spotify-token.pipe';
import { SkipSpotifyAuth } from './decorators/spotify-skip-auth.decorator';


@Controller('spotify')
@UseGuards(SpotifyTokenGuard)
export class SpotifyController {
    constructor(private authService: SpotifyAuthService) {}

    @Get('whoami')
    async getUsername(
        @SpotifyToken(SpotifyTokenPipe) spotifyToken: string
    ): Promise<string> {
        try {
            const username = await this.authService.getUsername(spotifyToken);
            return username;
        } catch (error) {
            // throw correct nest js error
            throw new HttpException('Failed to fetch username', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @Get('login')
    @SkipSpotifyAuth()
    login(@Res() res: Response): void{
        const loginParams = this.authService.login();
        res.redirect(`https://accounts.spotify.com/authorize?${loginParams}`);
    }

    @Get('callback')
    @SkipSpotifyAuth()
    async callback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Query('error') error: string,
        @Res() res: Response,
    ): Promise<void> {
        // Should be a Promise<void> since a response is sent back to the client
        try {
            const { access_token, refresh_token, expires_in } = await this.authService.validateCallback(code, state, error);
            res.cookie('spotify_refresh_token', refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            res.setHeader('x-spotify-token', access_token);

            // Remove this later. Callback should return a response
            res.json({"refresh_token": refresh_token});
        } catch (error) {
            throw new HttpException('Failed to fetch username', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }   
    
    @Get('refresh')
    @SkipSpotifyAuth()
    async refresh(
        @Req() req: Request,
        @Res() res: Response,
    ):Promise<void>{
        const refresh_token = req.cookies['spotify_refresh_token'];
        
        try {
            const { access_token, new_refresh_token } = await this.authService.refreshToken(refresh_token);

            if (new_refresh_token && refresh_token != new_refresh_token) {
                res.cookie('spotify_refresh_token', new_refresh_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                });
            }

            res.setHeader('x-spotify-token', access_token);

            res.json({"message" : "Refresh Successful"});

        } catch (error) {
            throw new HttpException(`Failed to refresh token : ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }
}