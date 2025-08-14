import { Controller, Get, Post, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('hello')
  getHello(): { message: string } {
    return { message: 'Hello' };
  }

  @Get('secure-hello')
  @UseGuards(JwtAuthGuard)
  getSecureHello(): { message: string } {
    return { message: 'Hello from secured endpoint' };
  }
  
  @Get('admin-hello')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  getAdminHello(): { message: string } {
    return { 
      message: 'I bow at your feet, Your Grace! The kingdom of API endpoints awaits your command!' 
    };
  }

  // ===== DEBUG ENDPOINTS =====
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
          role: user.role,
          passwordHashPrefix: user.password ? user.password.substring(0, 15) + '...' : 'No password'
        }))
      };
    } catch (error) {
      throw new HttpException(
        `Database connection failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Debug: Check what's actually in the database for this user
  @Get('debug/admin-user')
  async debugAdminUser() {
    try {
      const user = await this.userService.findByEmail('admin@noot.com');
      if (!user) {
        return { found: false, message: 'User not found' };
      }
      
      return {
        found: true,
        databaseId: user._id,
        databaseIdType: typeof user._id,
        databaseIdString: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        idFromLogin: '686e19e92f7b2bf4a9128809', // From your JWT
        idsMatch: user._id.toString() === '686e19e92f7b2bf4a9128809'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Debug: Try to find user by the JWT ID
  @Get('debug/find-by-jwt-id')
  async debugFindByJwtId() {
    try {
      const jwtId = '686e19e92f7b2bf4a9128809';
      
      // Try different ways to find the user
      const userById = await this.userService.findById(jwtId);
      
      // Also try with ObjectId
      const { ObjectId } = require('mongodb');
      let userByObjectId: any = null;
      try {
        const objectId = new ObjectId(jwtId);
        userByObjectId = await this.userService.findById(objectId.toString());
      } catch (objIdError) {
        console.log('ObjectId conversion failed:', objIdError.message);
      }

      return {
        jwtId,
        foundById: !!userById,
        foundByObjectId: !!userByObjectId,
        userById: userById ? {
          id: userById._id,
          email: userById.email,
          role: userById.role
        } : null,
        userByObjectId: userByObjectId ? {
          id: userByObjectId._id,
          email: userByObjectId.email,
          role: userByObjectId.role
        } : null
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Debug: List all users to see what IDs actually exist
  @Get('debug/all-users-ids')
  async debugAllUserIds() {
    try {
      const users = await this.userService.getAllUsersForDebug();
      return {
        totalUsers: users.length,
        users: users.map(user => ({
          id: user._id,
          idType: typeof user._id,
          idString: user._id.toString(),
          email: user.email,
          role: user.role,
          matchesJwtId: user._id.toString() === '686e19e92f7b2bf4a9128809'
        }))
      };
    } catch (error) {
      return { error: error.message };
    }
  }

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
          isBlocked: user.isBlocked,
          passwordHashPrefix: user.password ? user.password.substring(0, 15) + '...' : 'No password',
          passwordLength: user.password ? user.password.length : 0,
          isProperlyHashed: user.password ? user.password.startsWith('$2b$') : false
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error finding user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

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
        hashedPassword: user.password.substring(0, 20) + '...',
        isProperlyHashed: user.password.startsWith('$2b$'),
        providedPassword: loginData.password
      };
    } catch (error) {
      throw new HttpException(
        `Login test failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fix-admin-password')
  async fixAdminPassword(@Body() data: { email: string; newPassword: string }) {
    try {
      const result = await this.userService.fixAdminPassword(data.email, data.newPassword);
      
      if (result.success) {
        // Test the new password immediately
        const testResult = await this.userService.comparePassword(data.newPassword, 
          (await this.userService.findByEmail(data.email))?.password || '');
        
        return {
          ...result,
          testResult: testResult ? 'Password fix verified - login should work now' : 'Password fix failed verification'
        };
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to fix admin password: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('hash-password')
  async hashPassword(@Body() data: { password: string }) {
    try {
      const hashed = await this.userService.hashPassword(data.password);
      return {
        original: data.password,
        hashed: hashed,
        hashLength: hashed.length,
        startsWithBcrypt: hashed.startsWith('$2b$')
      };
    } catch (error) {
      throw new HttpException(
        `Failed to hash password: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('compare-passwords')
  async comparePasswords(@Body() data: { plain: string; hashed: string }) {
    try {
      const result = await this.userService.comparePassword(data.plain, data.hashed);
      return {
        matches: result,
        plainPassword: data.plain,
        hashedPassword: data.hashed.substring(0, 20) + '...',
        hashedIsProperFormat: data.hashed.startsWith('$2b$')
      };
    } catch (error) {
      throw new HttpException(
        `Failed to compare passwords: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('isEmailRegistered/:email')
  async isEmailRegistered(@Param('email') email: string) {
    try {
      const isRegistered = await this.userService.isEmailRegistered(email);
      return {
        email: email,
        isRegistered: isRegistered
      };
    } catch (error) {
      throw new HttpException(
        `Error checking email registration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('isUsernameRegistered/:username')
  async isUsernameRegistered(@Param('username') username: string) {
    try {
      const isRegistered = await this.userService.isUsernameRegistered(username);
      return {
        username: username,
        isRegistered: isRegistered
      };
    } catch (error) {
      throw new HttpException(
        `Error checking username registration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}