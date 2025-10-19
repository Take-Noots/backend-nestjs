import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Query,
  Req,
  Res,
  UseGuards,
  Put,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtRefreshUserPipe } from '../../common/pipes/jwt-refresh-user.pipe';
import {
  JwtUser,
  JwtUserData,
} from '../../common/decorators/jwt-user.decorator';
import { SkipSpotifyAuth } from './decorators/spotify-skip-auth.decorator';
import { SpotifyToken } from './decorators/spotify-token.decorator';
import { SpotifyTokenPipe } from './pipes/spotify-token.pipe';
import { SpotifyAuthService } from './services/spotify.auth-service';
import { SpotifySearchService } from './services/spotify.search-service';
import { SpotifySessionService } from './services/spotify.session-service';
import { SpotifyPlayerService } from './services/spotify.player-service';
import { PlayTrackDto } from './dto/play-track.dto';

@Controller('spotify')
// @UseGuards(SpotifyTokenGuard)
export class SpotifyController {
  constructor(
    private authService: SpotifyAuthService,
    private searchService: SpotifySearchService,
    private sessionService: SpotifySessionService,
    private playerService: SpotifyPlayerService,
  ) {}

  // ---------- AUTHENTICATION ENDPOINTS ----------
  @Get('whoami')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  async getUsername(@JwtUser() user: JwtUserData): Promise<
    | { username: string }
    | {
        success: boolean;
        message: string;
        requiresSpotifyLink: boolean;
        error: string;
      }
  > {
    try {
      // Get Spotify access token using the user ID (which might trigger a refresh)
      const spotifyToken = await this.sessionService.getAccessToken(
        user.userId,
      );

      if (!spotifyToken) {
        return {
          success: false,
          message: 'Spotify account not linked',
          requiresSpotifyLink: true,
          error: 'SPOTIFY_NOT_LINKED',
        };
      }

      // Get username using the Spotify access token
      const username = await this.authService.getUsername(spotifyToken);
      return { username };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch username: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('login')
  @UseGuards(JwtAuthGuard)
  login(@JwtUser() user: JwtUserData, @Res() res: Response): void {
    const state = this.sessionService.createStateToken(user.userId);

    const loginParams = this.authService.login(state);
    res.redirect(`https://accounts.spotify.com/authorize?${loginParams}`);
  }

  @Get('login/alt')
  loginAlt(@Req() req: Request, @Res() res: Response): void {
    // Extract refresh_token from cookies
    const userId = new JwtRefreshUserPipe().transform(req, { type: 'custom' });
    if (!userId) {
      throw new HttpException('No user found', HttpStatus.UNAUTHORIZED);
    }

    // You may want to associate the refresh token with a user in your DB here
    // For now, just use the refresh token as the state (or generate a state if needed)
    const state = this.sessionService.createStateToken(userId);
    const loginParams = this.authService.login(state);
    res.redirect(`https://accounts.spotify.com/authorize?${loginParams}`);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ): Promise<void> {
    // Should be a Promise<void> since a response is sent back to the client
    try {
      const { access_token, refresh_token, expires_in } =
        await this.authService.validateCallback(code, state, error);

      const userId = this.sessionService.verifyStateToken(state);
      if (!userId) {
        throw new HttpException(
          'Invalid state parameter',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Store the refresh token in database (encrypted)
      await this.sessionService.saveRefreshToken(userId, refresh_token);

      // Store access token in memory
      this.sessionService.storeAccessToken(userId, access_token, expires_in);

      console.log('Access token stored in memory for user:', userId);

      res.json({
        message: 'Authentication successful',
        user_id: userId,
      });
    } catch (error) {
      throw new HttpException(
        'Failed to process callback: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //     @Get('refresh')
  //     @SkipSpotifyAuth()
  //     async refresh(
  //         @SpotifyRefreshToken(SpotifyRefreshTokenPipe) refresh_token: string,
  //         @Res() res: Response,
  //     ):Promise<void>{
  //         try {
  //             const { access_token, new_refresh_token } = await this.authService.refreshToken(refresh_token);

  //       // Remove this later. Callback should return a response
  //       res.json({
  //         refresh_token: refresh_token,
  //         access_token: access_token,
  //       });
  //     } catch (error) {
  //       throw new HttpException(
  //         'Failed to fetch username',
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //       );
  //     }
  //   }

  @Get('/old/refresh')
  @SkipSpotifyAuth()
  async refresh(
    @Body('refresh_token') refresh_token: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { access_token, new_refresh_token } =
        await this.authService.refreshToken(refresh_token);

      if (new_refresh_token && refresh_token != new_refresh_token) {
        res.cookie('spotify_refresh_token', new_refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }

      res.setHeader('x-spotify-token', access_token);

      res.json({ message: 'Refresh Successful' });
    } catch (error) {
      throw new HttpException(
        `Failed to refresh token [at.spotify.controller]: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ---------- SEARCH ENDPOINTS ----------
  @Get('search/track')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  async searchTracks(
    @JwtUser() user: JwtUserData,
    @Query('track_name') track_name: string,
  ) {
    if (!track_name) {
      throw new HttpException(
        'track_name is required as a query parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Get Spotify access token using the user ID (refresh wenawa)
      const spotifyToken = await this.sessionService.getAccessToken(
        user.userId,
      );
      if (!spotifyToken) {
        throw new HttpException(
          'No Spotify token found for this user',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return await this.searchService.searchTracks(spotifyToken, track_name);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to search tracks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search/artists/top-tracks')
  async searchArtistsFamousTracks(
    @SpotifyToken(SpotifyTokenPipe) spotifyToken: string,
    @Body() body: { artist_name: string },
  ) {
    const { artist_name } = body;

    if (!artist_name) {
      throw new HttpException(
        'artist_name is required in request body',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.searchService.searchArtistsFamousTracks(
        spotifyToken,
        artist_name,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get artist tracks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ---------- PLAYER ENDPOINTS ----------
  @Get('player/current-track')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  async getCurrentTrack(@JwtUser() user: JwtUserData): Promise<
    | any
    | {
        success: boolean;
        message: string;
        requiresSpotifyLink: boolean;
        error: string;
      }
  > {
    try {
      // Get Spotify access token using the user ID (which might trigger a refresh)
      const spotifyToken = await this.sessionService.getAccessToken(
        user.userId,
      );

      if (!spotifyToken) {
        // Return a specific response indicating Spotify is not linked
        return {
          success: false,
          message: 'Spotify account not linked',
          requiresSpotifyLink: true,
          error: 'SPOTIFY_NOT_LINKED',
        };
      }

      // Get current track using the Spotify access token
      return await this.playerService.getCurrentTrack(spotifyToken);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch current track: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('player/play')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  async playTrack(
    @JwtUser() user: JwtUserData,
    @Body() playTrackDto: PlayTrackDto,
  ) {
    try {
      // Get Spotify access token using the user ID (which might trigger a refresh)
      const spotifyToken = await this.sessionService.getAccessToken(
        user.userId,
      );

      if (!spotifyToken) {
        throw new HttpException(
          'No Spotify token found for this user',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const { track_id, track_position } = playTrackDto;

      // If track_id is not provided, resume current playback
      if (!track_id) {
        return await this.playerService.resumeTrack(spotifyToken);
      }

      // Play the specified track using the Spotify access token
      return await this.playerService.playTrack(
        spotifyToken,
        track_id,
        track_position,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to play track: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('player/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  async pauseTrack(@JwtUser() user: JwtUserData) {
    try {
      // Get Spotify access token using the user ID (which might trigger a refresh)
      const spotifyToken = await this.sessionService.getAccessToken(
        user.userId,
      );

      if (!spotifyToken) {
        throw new HttpException(
          'No Spotify token found for this user',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Pause the current playback
      return await this.playerService.pauseTrack(spotifyToken);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to pause playback: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('player/next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  async nextTrack(@JwtUser() user: JwtUserData) {
    try {
      // Get Spotify access token using the user ID (which might trigger a refresh)
      const spotifyToken = await this.sessionService.getAccessToken(
        user.userId,
      );

      if (!spotifyToken) {
        throw new HttpException(
          'No Spotify token found for this user',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Skip to next track
      return await this.playerService.nextTrack(spotifyToken);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to skip to next track: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('player/previous')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  async previousTrack(@JwtUser() user: JwtUserData) {
    try {
      // Get Spotify access token using the user ID (which might trigger a refresh)
      const spotifyToken = await this.sessionService.getAccessToken(
        user.userId,
      );

      if (!spotifyToken) {
        throw new HttpException(
          'No Spotify token found for this user',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Skip to previous track
      return await this.playerService.previousTrack(spotifyToken);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to skip to previous track: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('player/post/play')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  async playPostTrack(
    @JwtUser() user: JwtUserData,
    @Body() playTrackDto: PlayTrackDto,
  ) {
    console.log('playPostTrack called with:', playTrackDto, 'user:', user);
    try {
      const spotifyToken = await this.sessionService.getAccessToken(
        user.userId,
      );
      if (!spotifyToken) {
        throw new HttpException(
          'No Spotify token found for this user',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const { track_id, track_position } = playTrackDto;
      if (!track_id) {
        return await this.playerService.resumeTrack(spotifyToken);
      }
      return await this.playerService.playTrack(
        spotifyToken,
        track_id,
        track_position,
      );
    } catch (error) {
      console.error('Error in playPostTrack:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to play post track: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('player/post/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  async pausePostTrack(@JwtUser() user: JwtUserData) {
    try {
      const spotifyToken = await this.sessionService.getAccessToken(
        user.userId,
      );
      if (!spotifyToken) {
        throw new HttpException(
          'No Spotify token found for this user',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return await this.playerService.pauseTrack(spotifyToken);
    } catch (error) {
      console.error('Error in pausePostTrack:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to pause post track: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
