import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { RegisterUserDTO } from './dto/register-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';
import { AuthService } from './auth.service';
import { UserType } from '@interfaces/user.interface';


@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService) {}

    @Post('register')
    async register(@Body() user: RegisterUserDTO ): Promise<{ message: string }> {
        try {
            await this.authService.register(user);
            return { message: 'User registered successfully' };
        } catch (error) {
            throw new HttpException(`Failed to register user : ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('login')
    async login(@Body() user: LoginUserDTO, @Res() res: Response) {
        try {
            const result = await this.authService.login(user);
            const [validatedUser, accessToken, refreshToken] = result as [UserType, string, string];

            res.cookie('refresh_token', refreshToken, { httpOnly: true });
            res.setHeader('Authorization', `Bearer ${accessToken}`);
            res.json({
                message: 'Authentication successful',
                user: {
                    id: validatedUser._id, // Include user ID
                    name: validatedUser.username,
                    email: validatedUser.email,
                    role: validatedUser.role,
                },
            });
        } catch (error) {
            throw new HttpException(`Failed to login user : ${error.message}`, HttpStatus.UNAUTHORIZED);
        }
    }
}