import { Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { RegisterUserDTO } from './dto/register-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';
import { UserType } from '@interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import * as jwt from 'jsonwebtoken';


const myAccessSecret = process.env.ACCESS_TOKEN_SECRET as string;
const myRefreshSecret = process.env.REFRESH_TOKEN_SECRET as string;
const myAccessTokenDuration = process.env.ACCESS_TOKEN_DURATION ? parseInt(process.env.ACCESS_TOKEN_DURATION) : 900; // 15 minutes
const myRefreshTokenDuration = process.env.REFRESH_TOKEN_DURATION ? parseInt(process.env.REFRESH_TOKEN_DURATION) : 604800; // 7 days


@Injectable()
export class AuthService {
    constructor(private userService: UserService) {}

    async register(newUser: RegisterUserDTO): Promise<void> {
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

        await this.userService.create(user);
    }

    async login(user: LoginUserDTO): Promise<[UserType, string, string]> {
        const foundUser = await this.userService.findByEmail(user.email);
        if (!foundUser) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const current_time = Math.floor(Date.now() / 1000);
        const access_expiration_time = current_time + myAccessTokenDuration; 
        const refresh_expiration_time = current_time + myRefreshTokenDuration; 

        const accessClaims = {
            sub: foundUser._id.toString(), // Use user ID in JWT claims
            exp: access_expiration_time,
        };

        const refreshClaims = {
            sub: foundUser._id.toString(), // Use user ID in JWT claims
            exp: refresh_expiration_time,
        };

        const accessToken = jwt.sign(accessClaims, myAccessSecret, { algorithm: 'HS256' });
        const refreshToken = jwt.sign(refreshClaims, myRefreshSecret, { algorithm: 'HS256' });

        return [ foundUser, accessToken, refreshToken ];
    }
}