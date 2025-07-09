// src/modules/user/user.controller.ts
import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Debug endpoint to test database connection
  @Get('test-connection')
  async testConnection() {
    try {
      const users = await this.userService.getAllUsersForDebug();
      return {
        success: true,
        message: 'Database connection working',
        userCount: users.length,
        users: users.map(user => ({
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role
        }))
      };
    } catch (error) {
      throw new HttpException(
        `Database connection failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Debug endpoint to find specific user
  @Get('find/:email')
  async findUserByEmail(@Param('email') email: string) {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        return { found: false, message: 'User not found' };
      }
      return {
        found: true,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          isBlocked: user.isBlocked
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error finding user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Debug endpoint to test password comparison
  @Post('test-login')
  async testLogin(@Body() loginData: { email: string; password: string }) {
    try {
      const user = await this.userService.findByEmail(loginData.email);
      if (!user) {
        return { success: false, message: 'User not found in database' };
      }

      const isPasswordValid = await this.userService.comparePassword(loginData.password, user.password);
      
      return {
        success: isPasswordValid,
        message: isPasswordValid ? 'Password matches' : 'Password does not match',
        userFound: true,
        userRole: user.role,
        hashedPassword: user.password.substring(0, 20) + '...' // Show first 20 chars for debugging
      };
    } catch (error) {
      throw new HttpException(
        `Login test failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}