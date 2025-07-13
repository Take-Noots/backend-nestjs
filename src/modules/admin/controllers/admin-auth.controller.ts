// src/modules/admin/controllers/admin-auth.controller.ts
import { Controller, Post, Body, Res, HttpException, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../../auth/auth.service';
import { LoginUserDTO } from '../../auth/dto/login-user.dto';
import { AdminGuard } from '../guards/admin.guard'; // Updated path

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async adminLogin(@Body() loginData: LoginUserDTO, @Res() res: Response) {
    try {
      const [user, accessToken, refreshToken] = await this.authService.login(loginData);

      // Check if user has admin/moderator privileges
      if (user.role !== 'admin' && user.role !== 'moderator') {
        throw new HttpException('Access denied. Admin privileges required.', HttpStatus.FORBIDDEN);
      }

      // Check if user is banned
      if (user.isBlocked) {
        throw new HttpException('Account is blocked. Contact administrator.', HttpStatus.FORBIDDEN);
      }

      // Set cookies for admin session
      res.cookie('admin_refresh_token', refreshToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.json({
        message: 'Admin login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        accessToken, // Also send in response for frontend storage
      });
    } catch (error) {
      throw new HttpException(
        `Admin login failed: ${error.message}`, 
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Get('profile')
  @UseGuards(AdminGuard)
  async getAdminProfile(@Request() req) {
    try {
      const user = req.user;
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch profile: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('logout')
  async adminLogout(@Res() res: Response) {
    try {
      // Clear admin cookies
      res.clearCookie('admin_refresh_token');
      res.clearCookie('access_token');
      
      res.json({ message: 'Admin logout successful' });
    } catch (error) {
      throw new HttpException(
        `Logout failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('verify')
  @UseGuards(AdminGuard)
  async verifyAdminToken(@Request() req) {
    // If we reach here, the guard has already verified the token
    return { 
      valid: true, 
      user: {
        id: req.user._id,
        username: req.user.username,
        role: req.user.role
      }
    };
  }
}