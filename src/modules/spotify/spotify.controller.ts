import { Controller, Get, Post, Body, HttpException, HttpStatus, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SpotifyRefreshToken } from './decorators/spotify-refresh-token.decorator';
import { SkipSpotifyAuth } from './decorators/spotify-skip-auth.decorator';
import { SpotifyToken } from './decorators/spotify-token.decorator';
import { SpotifyTokenGuard } from './guards/spotify-token.guard';
import { SpotifyRefreshTokenPipe } from './pipes/spotify-refresh-token.pipe';
import { SpotifyTokenPipe } from './pipes/spotify-token.pipe';
import { SpotifyAuthService } from './services/spotify.auth-service';
import { SpotifySearchService } from './services/spotify.search-service';


@Controller('spotify')
@UseGuards(SpotifyTokenGuard)
export class SpotifyController {
    constructor(
        private authService: SpotifyAuthService,
        private searchService: SpotifySearchService
    ) {}

    // ---------- AUTHENTICATION ENDPOINTS ----------
    @Get('whoami')
    async getUsername(
        @SpotifyToken(SpotifyTokenPipe) spotifyToken: string
    ): Promise<{username: string}> {
        try {
            const username = await this.authService.getUsername(spotifyToken);
            return { username };
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
        @SpotifyRefreshToken(SpotifyRefreshTokenPipe) refresh_token: string,
        @Res() res: Response,
    ):Promise<void>{
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

    // ---------- SEARCH ENDPOINTS ----------
    // Are these Gets? or Posts? I am confused on the fact
    // If post then => @Post('search/track')
    // If get then => @Get('search/track')
    @Get('search/track')
    async searchTracks(
        @SpotifyToken(SpotifyTokenPipe) spotifyToken: string,
        @Body() body: { track_name: string }
    ) {
        const { track_name } = body;
        
        if (!track_name) {
            throw new HttpException('track_name is required in request body', HttpStatus.BAD_REQUEST);
        }

        try {
            return await this.searchService.searchTracks(spotifyToken, track_name);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to search tracks', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('search/artists/top-tracks')
    async searchArtistsFamousTracks(
        @SpotifyToken(SpotifyTokenPipe) spotifyToken: string,
        @Body() body: { artist_name: string }
    ) {
        const { artist_name } = body;
        
        if (!artist_name) {
            throw new HttpException('artist_name is required in request body', HttpStatus.BAD_REQUEST);
        }

        try {
            return await this.searchService.searchArtistsFamousTracks(spotifyToken, artist_name);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to get artist tracks', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}