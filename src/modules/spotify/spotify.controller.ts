import { Controller, Get, Post, Body, HttpException, HttpStatus, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser, JwtUserData } from '../../common/decorators/jwt-user.decorator';
import { SpotifyRefreshToken } from './decorators/spotify-refresh-token.decorator';
import { SkipSpotifyAuth } from './decorators/spotify-skip-auth.decorator';
import { SpotifyToken } from './decorators/spotify-token.decorator';
import { SpotifyTokenGuard } from './guards/spotify-token.guard';
import { SpotifyRefreshTokenPipe } from './pipes/spotify-refresh-token.pipe';
import { SpotifyTokenPipe } from './pipes/spotify-token.pipe';
import { SpotifyAuthService } from './services/spotify.auth-service';
import { SpotifySearchService } from './services/spotify.search-service';
import { SpotifySessionService } from './services/spotify.session-service';


@Controller('spotify')
// @UseGuards(SpotifyTokenGuard)
export class SpotifyController {
    constructor(
        private authService: SpotifyAuthService,
        private searchService: SpotifySearchService,
        private sessionService: SpotifySessionService
    ) {}

    // ---------- AUTHENTICATION ENDPOINTS ----------
    @Get('whoami')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.User, Role.Admin)
    async getUsername(
        @JwtUser() user: JwtUserData
    ): Promise<{username: string}> {
        try {
            console.log('User ID from JWT:', user.userId);
            
            // Get Spotify access token using the user ID (which might trigger a refresh)
            const spotifyToken = await this.sessionService.getAccessToken(user.userId);
            
            if (!spotifyToken) {
                throw new HttpException('No Spotify token found for this user', HttpStatus.UNAUTHORIZED);
            }
            
            // Get username using the Spotify access token
            const username = await this.authService.getUsername(spotifyToken);
            return { username };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to fetch username: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @Get('login')
    @SkipSpotifyAuth()
    login(@Res() res: Response): void{
        const userId: string = "685fb750cc084ba7e0ef8533"; 
        const state = this.sessionService.createStateToken(userId);

        const loginParams = this.authService.login(state);
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

            const userId = this.sessionService.verifyStateToken(state);
            if (!userId) {
                throw new HttpException('Invalid state parameter', HttpStatus.BAD_REQUEST);
            }
            

            // Store the refresh token in database (encrypted)
            await this.sessionService.saveRefreshToken(userId, refresh_token);
            

            // Store access token in memory
            this.sessionService.storeAccessToken(userId, access_token, expires_in);

            console.log('Access token stored in memory for user:', userId);

            res.json({
                message: "Authentication successful",
                user_id: userId
            });
            // res.cookie('spotify_refresh_token', refresh_token, {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === 'production',
            //     maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            // });

            // res.setHeader('x-spotify-token', access_token);

            // // Remove this later. Callback should return a response
            // res.json({"refresh_token": refresh_token});
        } catch (error) {
            throw new HttpException('Failed to process callback: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
        @Query('track_name') track_name: string
    ) {
        if (!track_name) {
            throw new HttpException('track_name is required as a query parameter', HttpStatus.BAD_REQUEST);
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