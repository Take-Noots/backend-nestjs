import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';

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
}
