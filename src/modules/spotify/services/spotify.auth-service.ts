import {Injectable} from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
import 'dotenv/config';


const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const CLIENT_SCOPE = process.env.SPOTIFY_CLIENT_SCOPE;

// In-memory store for code verifiers (use Redis in production)
const codeVerifierStore = new Map<string, string>();

// Generate random string for code verifier
const generateCodeVerifier = (length: number): string => {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

// Generate code challenge from verifier
const generateCodeChallenge = (verifier: string): string => {
    return crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};


@Injectable()
export class SpotifyAuthService {

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

    login(jwtState: string): string {
        const state = jwtState;
        const codeVerifier = generateCodeVerifier(128);
        const codeChallenge = generateCodeChallenge(codeVerifier);
        
        codeVerifierStore.set(state, codeVerifier);

        const params = querystring.stringify({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: CLIENT_SCOPE,
            redirect_uri: REDIRECT_URI,
            state: state,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge
        });

        return params;
    }

    async validateCallback(code: string, state: string, error: string): 
    Promise<{ access_token: string, refresh_token: string, expires_in: number }> {
        if (error) {
            throw new Error(`Spotify authorization error: ${error}`);
        }
        if (!state || !code) {
            throw new Error('Invalid request: missing state or code');
        }

        const codeVerifier = codeVerifierStore.get(state);
        if (!codeVerifier) {
            throw new Error('Invalid state: code verifier not found');
        }

        try {
            const tokenResponse = await axios.post(
                'https://accounts.spotify.com/api/token',
                querystring.stringify({
                code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                code_verifier: codeVerifier,
                }),
                {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                },
            );

            const { access_token, refresh_token, expires_in } = tokenResponse.data;
            
            // Clean up the codeVerifierStore after successful validation
            codeVerifierStore.delete(state);
            
            return { access_token, refresh_token, expires_in };
            
        } catch (error: any) {
            throw new Error(`Failed to exchange code for token: ${error.message}`);
        }   
    }

    async refreshToken(refresh_token: string): Promise<{ access_token: string, new_refresh_token: string }> {
        console.log("Debug [at.spotify.auth.service] : Refresh token is", refresh_token);
        if (!refresh_token) {
            throw new Error('Refresh token is required');
        }

        try {
            const response = await axios.post('https://accounts.spotify.com/api/token', 
                querystring.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token as string,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET 
                }), {
                    headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                    }
            });

            const { access_token, refresh_token: new_refresh_token } = response.data;
            
            return { access_token, new_refresh_token };
            
        } catch (error: any) {
            throw new Error(`Failed to refresh token [at.spotify.auth.service]: ${error.message}`);
        }
    }

}