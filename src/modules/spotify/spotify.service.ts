import {Injectable} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SpotifyService {

    async getUsername(accessToken: string): Promise<string> {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            return(response.data.display_name);
        } catch (error: any) {
            throw new Error(`Failed to fetch username: ${error.message}`);

        }
    }

}