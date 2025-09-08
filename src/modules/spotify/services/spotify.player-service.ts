import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';

export interface TopArtistsResponse {
  items: Array<{
    id: string;
    name: string;
    genres: string[];
    popularity: number;
  }>;
}

export interface RecentlyPlayedResponse {
  items: Array<{
    track: {
      id: string;
      name: string;
      artists: Array<{ name: string }>;
    };
    played_at: string;
  }>;
}

@Injectable()
export class SpotifyPlayerService {
    
    async getCurrentTrack(accessToken: string) {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (response.status === 204) {
                // No track is currently playing
                return { is_playing: false };
            }

            const track = response.data;
            return {
                is_playing: true,
                track: {
                    name: track.item.name,
                    artists: track.item.artists.map((artist: any) => artist.name),
                    album: track.item.album.name,
                    duration_ms: track.item.duration_ms,
                    progress_ms: track.progress_ms,
                    is_playing: track.is_playing
                }
            };
        } catch (error) {
            throw new HttpException('Failed to fetch current track: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async playTrack(accessToken: string, trackId: string, trackPosition: number = 0) {
        try {
            await axios.put('https://api.spotify.com/v1/me/player/play',
                {        
                    uris: [`spotify:track:${trackId}`],
                    position_ms: trackPosition
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            return { is_playing: true };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to play track';
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    async resumeTrack(accessToken: string) {
        try {
            await axios.put('https://api.spotify.com/v1/me/player/play',
                {}, // Empty body to resume current track
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            return { is_playing: true };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to resume playback';
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    async pauseTrack(accessToken: string) {
        try {
            await axios.put('https://api.spotify.com/v1/me/player/pause',
                {}, // Empty body
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            return { is_playing: false };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to pause playback';
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    async nextTrack(accessToken: string) {
        try {
            await axios.post('https://api.spotify.com/v1/me/player/next',
                {}, // Empty body
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            return { success: true, message: 'Skipped to next track' };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to skip to next track';
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    async previousTrack(accessToken: string) {
        try {
            await axios.post('https://api.spotify.com/v1/me/player/previous',
                {}, // Empty body
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            return { success: true, message: 'Skipped to previous track' };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to skip to previous track';
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTopArtists(accessToken: string): Promise<TopArtistsResponse> {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    limit: 20,
                    time_range: 'medium_term'
                }
            });

            return {
                items: response.data.items.map((artist: any) => ({
                    id: artist.id,
                    name: artist.name,
                    genres: artist.genres || [],
                    popularity: artist.popularity || 0
                }))
            };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch top artists';
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getRecentlyPlayed(accessToken: string): Promise<RecentlyPlayedResponse> {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    limit: 50
                }
            });

            return {
                items: response.data.items.map((item: any) => ({
                    track: {
                        id: item.track.id,
                        name: item.track.name,
                        artists: item.track.artists.map((artist: any) => ({ name: artist.name }))
                    },
                    played_at: item.played_at
                }))
            };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch recently played tracks';
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
