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
        const refreshToken = await this.getRefreshToken(userId);

        if (!refreshToken) {
          throw new Error('No refresh token available for user: ' + userId);
        }

        // Import SpotifyAuthService to prevent circular dependency
        const { SpotifyAuthService } = await import(
          '../services/spotify.auth-service'
        );
        const spotifyAuthService = new SpotifyAuthService();

        // Get new tokens using the refresh token
        const { access_token, new_refresh_token } =
          await spotifyAuthService.refreshToken(refreshToken);

        // Save new refresh token if provided (Spotify may not always return a new one)
        if (new_refresh_token && new_refresh_token !== refreshToken) {
          await this.saveRefreshToken(userId, new_refresh_token);
        }

        // Store new access token in memory
        this.storeAccessToken(userId, access_token, 3600); // Default to 1 hour if expires_in is not provided

        return access_token;
      } catch (error) {
        console.error(
          'Failed to refresh access token [at.spotify.session.service] :',
          error,
        );

        // If refresh token is invalid (400 error), clear it from database
        if (
          error.message &&
          (error.message.includes('400') ||
            error.message.includes('Bad Request') ||
            error.message.includes('invalid'))
        ) {
          console.warn(
            `Invalid refresh token for user ${userId}, clearing from database`,
          );
          // await this.clearRefreshToken(userId);
        }

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
}
