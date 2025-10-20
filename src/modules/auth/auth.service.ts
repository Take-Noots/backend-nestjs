import { Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { RegisterUserDTO } from './dto/register-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';
import { UserType } from '@interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import * as jwt from 'jsonwebtoken';
import { SpotifySessionService } from '@modules/spotify/services/spotify.session-service';

const myAccessSecret = process.env.ACCESS_TOKEN_SECRET as string;
const myRefreshSecret = process.env.REFRESH_TOKEN_SECRET as string;
const myAccessTokenDuration = process.env.ACCESS_TOKEN_DURATION
  ? parseInt(process.env.ACCESS_TOKEN_DURATION)
  : 900; // 15 minutes
const myRefreshTokenDuration = process.env.REFRESH_TOKEN_DURATION
  ? parseInt(process.env.REFRESH_TOKEN_DURATION)
  : 604800; // 7 days

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private spotifySessionService: SpotifySessionService,
  ) {}

  async register(newUser: RegisterUserDTO): Promise<any> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(newUser.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newUser.password, salt);
    const user = {
      email: newUser.email,
      username: newUser.username,
      password: hashedPassword,
      role: newUser.role,
    };

    const createdUser = await this.userService.create(user);
    return createdUser;
  }

  async login(
    user: LoginUserDTO,
  ): Promise<[UserType, string, string, boolean]> {
    const foundUser = await this.userService.findByEmail(user.email);
    if (!foundUser) {
      throw new Error('Invalid credentials - User not found');
    }

    // Debug logging - Enhanced
    console.log('Login attempt for:', user.email);
    console.log('Found user role:', foundUser.role);
    console.log('User ID from database:', foundUser._id);
    console.log('User ID type:', typeof foundUser._id);
    console.log('User ID as string:', foundUser._id.toString());
    console.log('User ID length:', foundUser._id.toString().length);

    // Check if password is already hashed (in case it was stored incorrectly)
    if (foundUser.password && !foundUser.password.startsWith('$2b$')) {
      console.log('Password appears to be unhashed, comparing directly');
      if (foundUser.password !== user.password) {
        throw new Error('Invalid credentials - Password mismatch (direct)');
      }
    } else {
      // Normal bcrypt comparison
      console.log('Using bcrypt comparison');
      const isPasswordValid = await bcrypt.compare(
        user.password,
        foundUser.password,
      );
      console.log('Bcrypt comparison result:', isPasswordValid);

      if (!isPasswordValid) {
        throw new Error('Invalid credentials - Password mismatch (bcrypt)');
      }
    }

    // Check if Spotify is linked
    const isSpotifyLinked = await this.spotifySessionService.isSpotifyLinked(
      foundUser._id.toString(),
    );

    const current_time = Math.floor(Date.now() / 1000);
    const access_expiration_time = current_time + myAccessTokenDuration;
    const refresh_expiration_time = current_time + myRefreshTokenDuration;

    // IMPORTANT: Ensure the user ID is properly converted to string
    const userIdString = foundUser._id.toString();
    console.log('🔑 Creating JWT with user ID:', userIdString);
    console.log('🔑 User ID length in JWT:', userIdString.length);

    const accessClaims = {
      sub: userIdString, // Ensure this is a string
      email: foundUser.email, // Add email to help with debugging
      exp: access_expiration_time,
      role: foundUser.role,
    };

    const refreshClaims = {
      sub: userIdString, // Ensure this is a string
      email: foundUser.email, // Add email to help with debugging
      exp: refresh_expiration_time,
      role: foundUser.role,
    };

    const accessToken = jwt.sign(accessClaims, myAccessSecret, {
      algorithm: 'HS256',
    });
    const refreshToken = jwt.sign(refreshClaims, myRefreshSecret, {
      algorithm: 'HS256',
    });

    console.log(
      '✅ Login successful for:',
      foundUser.email,
      'Role:',
      foundUser.role,
    );
    console.log('🔑 JWT created with ID:', userIdString);

    // Verify the token we just created
    try {
      const decoded = jwt.verify(accessToken, myAccessSecret) as any;
      console.log('✅ Token verification test passed:', {
        sub: decoded.sub,
        email: decoded.email,
        subType: typeof decoded.sub,
        subLength: decoded.sub.length,
      });

      // Test if we can find the user with this ID
      const testUser = await this.userService.findById(decoded.sub);
      if (testUser) {
        console.log('✅ User lookup test passed - found user:', testUser.email);
      } else {
        console.error(
          '❌ User lookup test FAILED - cannot find user with ID:',
          decoded.sub,
        );
      }
    } catch (verifyError) {
      console.error('❌ Token verification test failed:', verifyError.message);
    }

    return [foundUser, accessToken, refreshToken, isSpotifyLinked];
  }

  // Token refresh functionality (from main branch)
  async refresh(
    refreshToken: string,
  ): Promise<[string, string, string, string, boolean]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Verify the refresh token
        jwt.verify(
          refreshToken,
          myRefreshSecret,
          async (err: Error | null, payload: any) => {
            if (err) {
              return reject(new Error('Invalid refresh token'));
            }

            // Extract user ID and role from payload
            const userId = payload.sub;
            const role = payload.role;
            // Check if Spotify is linked
            const isSpotifyLinked =
              await this.spotifySessionService.isSpotifyLinked(userId);

            // NOTE: For improved security, we should verify if the user exists in database:
            // const user = await this.userService.findById(userId);
            // if (!user) {
            //     return reject(new Error('User not found or has been deactivated'));
            // }
            // This approach sacrifices some performance for better security by ensuring
            // the user still exists and hasn't been deactivated since the token was issued.

            // Generate new tokens
            const current_time = Math.floor(Date.now() / 1000);
            const access_expiration_time = current_time + myAccessTokenDuration;
            const refresh_expiration_time =
              current_time + myRefreshTokenDuration;

            const accessClaims = {
              sub: userId,
              exp: access_expiration_time,
              role: role,
            };

            const refreshClaims = {
              sub: userId,
              exp: refresh_expiration_time,
              role: role,
            };

            const newAccessToken = jwt.sign(accessClaims, myAccessSecret, {
              algorithm: 'HS256',
            });
            const newRefreshToken = jwt.sign(refreshClaims, myRefreshSecret, {
              algorithm: 'HS256',
            });

            resolve([
              newAccessToken,
              newRefreshToken,
              userId,
              role,
              isSpotifyLinked,
            ]);
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // Admin helper methods (from sandun branch)
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  // Method to test password hashing (useful for admin dashboard)
  async testPasswordHash(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    console.log('Testing password hash:');
    console.log('Plain password:', plainPassword);
    console.log('Hashed password:', hashedPassword);

    const result = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('Comparison result:', result);

    return result;
  }
}
