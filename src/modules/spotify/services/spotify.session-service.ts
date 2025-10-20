import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SpotifySession, SpotifySessionDocument } from '../spotify.model';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import 'dotenv/config';

// Interface for storing token data in memory
export interface TokenData {
  accessToken: string;
  expiresAt: number; // timestamp when the token expires
}

@Injectable()
export class SpotifySessionService {
  // In-memory token store
  private tokenStore: Map<string, TokenData> = new Map();
  private readonly JWT_SECRET: string =
    process.env.JWT_SECRET || 'default-jwt-secret';
  private readonly ENCRYPTION_KEY: string =
    process.env.SPOTIFY_ENCRYPTION_KEY ||
    'default-encryption-key-32-chars-long!';
  private readonly ENCRYPTION_IV: string =
    process.env.SPOTIFY_ENCRYPTION_IV || 'default-iv-16chr';

  // Retry configuration
  private readonly MAX_RETRY_COUNT = 3;

  constructor(
    @InjectModel(SpotifySession.name)
    private sessionModel: Model<SpotifySessionDocument>,
  ) {}

  // Encrypt the refresh token before storing
  private encryptToken(token: string): string {
    const key = Buffer.from(this.ENCRYPTION_KEY, 'utf8');
    const iv = Buffer.from(this.ENCRYPTION_IV, 'utf8');

    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      key.length === 32 ? key : key.slice(0, 32),
      iv.length === 16 ? iv : iv.slice(0, 16),
    );

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt the refresh token for use
  private decryptToken(encryptedToken: string): string {
    const key = Buffer.from(this.ENCRYPTION_KEY, 'utf8');
    const iv = Buffer.from(this.ENCRYPTION_IV, 'utf8');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      key.length === 32 ? key : key.slice(0, 32),
      iv.length === 16 ? iv : iv.slice(0, 16),
    );

    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Create JWT state with user ID
  createStateToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: '1h' });
  }

  // Verify and extract user ID from state token
  verifyStateToken(state: string): string {
    try {
      const decoded = jwt.verify(state, this.JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new Error('Invalid or expired state token: ' + error.message);
    }
  }

  // Store access token in memory
  storeAccessToken(
    userId: string,
    accessToken: string,
    expiresIn: number,
  ): void {
    this.tokenStore.set(userId, {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    });
  }

  // Get access token from memory
  async getAccessToken(userId: string): Promise<string | null> {
    const tokenData = this.tokenStore.get(userId);

    // If we have a valid, non-expired token, return it
    if (tokenData && tokenData.expiresAt > Date.now()) {
      return tokenData.accessToken;
    }

    // If token is expired or not found, try to refresh it
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      // Clear expired token if it exists
      if (tokenData) {
        this.tokenStore.delete(userId);
      }

      try {
        // Get refresh token from database
        const session = await this.sessionModel
          .findOne({ user_id: userId })
          .exec();
        const refreshToken = session
          ? this.decryptToken(session.refresh_token)
          : null;

        if (!refreshToken) {
          throw new Error('No refresh token available for user: ' + userId);
        }

        // Import SpotifyAuthService to prevent circular dependency
        const { SpotifyAuthService } = await import(
          '../services/spotify.auth-service'
        );
        const spotifyAuthService = new SpotifyAuthService();

        // Get new tokens using the refresh token WITH RETRY
        const { access_token, new_refresh_token } =
          await spotifyAuthService.refreshTokenWithRetry(refreshToken);

        // Reset retry count on successful refresh
        if (session) {
          session.retry_count = 0;
          session.requires_user_confirmation = false;
          session.last_error_message = '';
          session.updatedAt = new Date();
          await session.save();
        }

        // Save new refresh token if provided (Spotify may not always return a new one)
        if (new_refresh_token && new_refresh_token !== refreshToken) {
          await this.saveRefreshToken(userId, new_refresh_token);
        }

        // Store new access token in memory
        this.storeAccessToken(userId, access_token, 172800); // Default to 48 hours if expires_in is not provided

        return access_token;
      } catch (error) {
        console.error(
          'Failed to refresh access token [at.spotify.session.service] :',
          error,
        );

        // Track retry attempts and handle failure
        await this.handleRefreshFailure(userId, error);

        return null; // Return null instead of empty string to indicate failure
      }
    }

    return ''; // This line should never be reached, but TypeScript needs it
  }

  // Save or update refresh token in database
  async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<SpotifySession> {
    const encryptedToken = this.encryptToken(refreshToken);

    // Try to find existing session for this user
    const existingSession = await this.sessionModel
      .findOne({ user_id: userId })
      .exec();

    if (existingSession) {
      // Update existing session
      existingSession.refresh_token = encryptedToken;
      existingSession.updatedAt = new Date();
      return existingSession.save();
    } else {
      // Create new session
      const newSession = new this.sessionModel({
        user_id: userId,
        refresh_token: encryptedToken,
      });
      return newSession.save();
    }
  }

  // Get refresh token for a user
  async getRefreshToken(userId: string): Promise<string | null> {
    const session = await this.sessionModel.findOne({ user_id: userId }).exec();
    if (!session) {
      return null;
    }

    return this.decryptToken(session.refresh_token);
  }

  // Check if user has a stored refresh token
  async hasSpotifySession(userId: string): Promise<boolean> {
    const session = await this.sessionModel.findOne({ user_id: userId }).exec();
    return !!session;
  }

  // Check if a Spotify session exists for a user
  async isSpotifyLinked(userId: string): Promise<boolean> {
    const session = await this.sessionModel.findOne({ user_id: userId }).exec();
    return !!session;
  }

  // Delete a user's session
  async deleteSession(userId: string): Promise<boolean> {
    const result = await this.sessionModel
      .deleteOne({ user_id: userId })
      .exec();
    this.tokenStore.delete(userId);
    return result.deletedCount > 0;
  }

  // Handle refresh token failure and track retries
  private async handleRefreshFailure(
    userId: string,
    error: any,
  ): Promise<void> {
    try {
      const session = await this.sessionModel
        .findOne({ user_id: userId })
        .exec();

      if (!session) {
        console.warn(`No session found for user ${userId}, cannot track retry`);
        return;
      }

      // Increment retry count
      session.retry_count = (session.retry_count || 0) + 1;
      session.last_retry_at = new Date();
      session.last_error_message = error.message || 'Unknown error';

      // Check if error is a permanent failure (invalid_grant, revoked token)
      const isInvalidToken =
        error.message?.includes('invalid_grant') ||
        error.message?.includes('Refresh token revoked') ||
        error.spotifyError === 'invalid_grant';

      if (isInvalidToken) {
        console.warn(
          `[Spotify Session] Invalid/revoked token for user ${userId}. ` +
            `Marking for user confirmation (retry count: ${session.retry_count})`,
        );
        session.requires_user_confirmation = true;
      } else if (session.retry_count >= this.MAX_RETRY_COUNT) {
        // After max retries, require user confirmation
        console.warn(
          `[Spotify Session] Max retries (${this.MAX_RETRY_COUNT}) reached for user ${userId}. ` +
            `Marking for user confirmation`,
        );
        session.requires_user_confirmation = true;
      } else {
        console.log(
          `[Spotify Session] Retry ${session.retry_count}/${this.MAX_RETRY_COUNT} ` +
            `for user ${userId}. Will retry automatically next time.`,
        );
      }

      await session.save();
    } catch (saveError) {
      console.error(
        `[Spotify Session] Failed to update session after refresh failure:`,
        saveError,
      );
    }
  }

  // Get session status for a user
  async getSessionStatus(userId: string): Promise<{
    isLinked: boolean;
    requiresConfirmation: boolean;
    retryCount: number;
    lastError: string | null;
  }> {
    const session = await this.sessionModel.findOne({ user_id: userId }).exec();

    if (!session) {
      return {
        isLinked: false,
        requiresConfirmation: false,
        retryCount: 0,
        lastError: null,
      };
    }

    return {
      isLinked: true,
      requiresConfirmation: session.requires_user_confirmation || false,
      retryCount: session.retry_count || 0,
      lastError: session.last_error_message || null,
    };
  }

  // User confirms they want to clear/relink Spotify
  async confirmClearSession(userId: string): Promise<boolean> {
    const session = await this.sessionModel.findOne({ user_id: userId }).exec();

    if (!session) {
      console.warn(`No session found for user ${userId} to clear`);
      return false;
    }

    console.log(
      `[Spotify Session] User ${userId} confirmed clearing Spotify session ` +
        `(retry count was: ${session.retry_count})`,
    );

    return this.deleteSession(userId);
  }
}
