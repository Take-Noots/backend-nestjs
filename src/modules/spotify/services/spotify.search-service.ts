import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface SearchTracksResponse {
    tracks: {
        items: Array<{
            id: string;
            name: string;
            artists: string[];
            album: string;
        }>;
        [key: string]: any;
    };
}

export interface ArtistTopTracksResponse {
    tracks: Array<{
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: {
            images: Array<{ url: string }>;
        };
        [key: string]: any;
    }>;
}

@Injectable()
export class SpotifySearchService {
    async searchTracks(accessToken: string, trackName: string): Promise<SearchTracksResponse> {
        try {
            const response = await axios.get('https://api.spotify.com/v1/search', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    q: 'track:' + trackName,
                    type: 'track',
                    limit: 10
                }
            });

            const filteredResponse: SearchTracksResponse = {
                tracks: {
                    ...response.data.tracks,
                    items: response.data.tracks.items.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        artists: item.artists.map((artist: any) => artist.name),
                        album: item.album.images[0]?.url || ''
                    }))
                }
            };

            return filteredResponse;
        } catch (error: any) {
            console.error('Spotify API Error:', error);
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to search tracks';
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async searchArtistsFamousTracks(accessToken: string, artistName: string): Promise<ArtistTopTracksResponse> {
        try {
            // First, search for the artist to get their ID
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    q: 'artist:' + artistName,
                    type: 'artist',
                    limit: 1
                }
            });

            if (!searchResponse.data.artists.items.length) {
                throw new HttpException('Artist not found', HttpStatus.NOT_FOUND);
            }

            const artistId = searchResponse.data.artists.items[0].id;

            // Then get their top tracks
            const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    market: 'US'
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('Spotify API Error:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to get artist tracks';
            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
