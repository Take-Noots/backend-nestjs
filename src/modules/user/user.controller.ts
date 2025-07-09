import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('user')
export class UserController {
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
}