import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
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
            // res.setHeader('Authorization', `Bearer ${accessToken}`);
            res.status(200).json({
                message: 'Authentication successful',
                accessToken: accessToken,
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

    @Post('refresh')
    async refresh(@Req() req: Request, @Res() res: Response) {
        try {
            // Extract refresh token from cookies
            const refreshToken = req.cookies?.refresh_token;
            
            if (!refreshToken) {
                throw new Error('Refresh token not provided');
            }
            
            // Call service to validate and generate new tokens
            const [accessToken, newRefreshToken, userId, role] = await this.authService.refresh(refreshToken);
            
            // Set new refresh token in cookie
            res.cookie('refresh_token', newRefreshToken, { httpOnly: true });
            
            // Return new access token
            res.status(200).json({
                message: 'Token refreshed successfully',
                accessToken: accessToken,
                user: {
                    id: userId,
                    role: role
                }
            });
            
        } catch (error) {
            throw new HttpException(`Failed to refresh token: ${error.message}`, HttpStatus.UNAUTHORIZED);
        }
    }
}