import { Injectable } from '@nestjs/common';
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
  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 3000; // 3 seconds base delay

  async getUsername(accessToken: string): Promise<string> {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.display_name;
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
      code_challenge: codeChallenge,
    });

    return params;
  }

  async validateCallback(
    code: string,
    state: string,
    error: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
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

  async refreshToken(
    refresh_token: string,
  ): Promise<{ access_token: string; new_refresh_token?: string }> {
    console.log(
      'Debug [at.spotify.auth.service] : Refresh token is',
      refresh_token,
    );
    if (!refresh_token) {
      throw new Error('Refresh token is required');
    }

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: refresh_token as string,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const {
        access_token,
        refresh_token: new_refresh_token,
        error,
        error_description,
      } = response.data;

      // Check if Spotify returned an error
      if (error) {
        console.error(`Spotify API Error: ${error} - ${error_description}`);
        throw new Error(`Spotify API Error: ${error} - ${error_description}`);
      }

      console.log(
        'Debug [at.spotify.auth.service] : Token refresh successful, new refresh token:',
        !!new_refresh_token,
      );

      return { access_token, new_refresh_token };
    } catch (error: any) {
      console.error(
        'Debug [at.spotify.auth.service] : Refresh token error details:',
        error.response?.data || error.message,
      );

      // Rethrow with error details for retry logic
      const errorData = error.response?.data;
      const errorObj = new Error(
        `[At.spotify.auth.service] Failed to refresh token: ${error.message}`,
      );
      (errorObj as any).statusCode = error.response?.status;
      (errorObj as any).spotifyError = errorData?.error;
      (errorObj as any).errorDescription = errorData?.error_description;

      throw errorObj;
    }
  }

  // Helper method to determine if error is retryable
  isRetryableError(error: any): boolean {
    const statusCode = error.statusCode || error.response?.status;
    const spotifyError = error.spotifyError || error.response?.data?.error;

    // Don't retry on invalid_grant (revoked/expired token)
    if (spotifyError === 'invalid_grant') {
      return false;
    }

    // Don't retry on 400 (bad request) or 403 (forbidden)
    if (statusCode === 400 || statusCode === 403) {
      return false;
    }

    // Retry on network errors, 5xx errors, or rate limits (429)
    if (!statusCode || statusCode >= 500 || statusCode === 429) {
      return true;
    }

    return false;
  }

  // Refresh token with retry logic
  async refreshTokenWithRetry(
    refresh_token: string,
    attempt: number = 1,
  ): Promise<{ access_token: string; new_refresh_token?: string }> {
    try {
      console.log(
        `[Spotify Auth] Token refresh attempt ${attempt}/${this.MAX_RETRIES}`,
      );

      const result = await this.refreshToken(refresh_token);

      console.log(
        `[Spotify Auth] Token refresh succeeded on attempt ${attempt}`,
      );

      return result;
    } catch (error: any) {
      console.error(
        `[Spotify Auth] Token refresh failed on attempt ${attempt}:`,
        error.message,
      );

      // Check if error is retryable
      if (!this.isRetryableError(error)) {
        console.log('[Spotify Auth] Error is not retryable, giving up');
        throw error;
      }

      // If we've exhausted retries, throw
      if (attempt >= this.MAX_RETRIES) {
        console.error(
          `[Spotify Auth] All ${this.MAX_RETRIES} retry attempts failed`,
        );
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = this.RETRY_DELAY_MS * attempt;
      console.log(
        `[Spotify Auth] Retrying in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry
      return this.refreshTokenWithRetry(refresh_token, attempt + 1);
    }
  }
}
