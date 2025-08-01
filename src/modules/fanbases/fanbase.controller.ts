// src/modules/fanbases/fanbase.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  Body, 
  Query, 
  HttpException, 
  HttpStatus, 
  UseGuards, 
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FanbaseService } from './fanbase.service';
import { CreateFanbaseDTO } from './dto/create-fanbase.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser, JwtUserData } from '../../common/decorators/jwt-user.decorator';

@Controller('fanbase')
export class FanbaseController {
  constructor(
    private readonly fanbaseService: FanbaseService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  @UseInterceptors(FileInterceptor('image')) // Handle file uploads
  async createFanbase(
    @Body() createFanbaseDto: CreateFanbaseDTO,
    @UploadedFile() file: any, // Use 'any' type or install @types/multer
    @JwtUser() user: JwtUserData
  ) {
    try {
      console.log('Creating fanbase with data:', createFanbaseDto);
      console.log('User:', user);
      console.log('File:', file ? `${file.originalname} (${file.size} bytes)` : 'No file');

      // Extract user ID from JWT user data
      const userId = user.userId;
      
      // If a file was uploaded, you might want to process it here
      // For now, we'll just use the fanbasePhotoUrl from the DTO
      
      // Pass userId separately to service
      return await this.fanbaseService.create(createFanbaseDto, userId);
    } catch (error) {
      console.error('Error creating fanbase:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getFanbaseById(@Param('id') id: string) {
    try {
      console.log("CALLING GET FANBASE BY ID", id);
      const fanbase = await this.fanbaseService.findById(id);
      console.log("FANBASE FOUND", fanbase);
      if (!fanbase) {
        throw new HttpException('Fanbase not found', HttpStatus.NOT_FOUND);
      }
      return fanbase;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('name/:name')
  async getFanbaseByName(@Param('name') name: string) {
    try {
      const fanbase = await this.fanbaseService.findByName(name);
      if (!fanbase) {
        throw new HttpException('Fanbase not found', HttpStatus.NOT_FOUND);
      }
      return fanbase;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Main route that frontend calls - GET /fanbase
  @Get()
  async getAllFanbases(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    try {
      const skip = (page - 1) * limit;
      return await this.fanbaseService.findAllWithPagination({}, skip, limit);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch fanbases: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('top/:limit')
  async getTopFanbases(@Param('limit') limit: number = 10) {
    try {
      return await this.fanbaseService.getTopFanbases(limit);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch top fanbases: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}