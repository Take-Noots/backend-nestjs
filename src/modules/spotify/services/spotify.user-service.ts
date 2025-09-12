import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SpotifyUserService {
    
    // async getUsersTopTracks(accessToken: string) {
    //     try {
    //         // Cant seem to get this to wrok so hard coding result
    //         // const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
    //         //     headers: {
    //         //         Authorization: `Bearer ${accessToken}`
    //         //     }
    //         // });
    //         // return response.data;

    //         return {tracks: [
    //             '6K6wDKxAKY3yRoWnf7O2fT',
    //             '3AoEQRuFf8zVXWqSLo2UOi',
    //             '4bzbaBvahwx1R0jyh5TO8U',
    //             '6Cg8d5DzpKHGci9SPk8JeL',
    //             '5mqnPqDTEjgv0hQD4r7v5v'
    //         ]}
    //     } catch (error) {
    //         throw new HttpException('Failed to fetch user\'s top tracks: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    //     }
    // }
}