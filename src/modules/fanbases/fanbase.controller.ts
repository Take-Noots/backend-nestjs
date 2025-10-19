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
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FanbaseService } from './fanbase.service';
import { CreateFanbaseDTO } from './dto/create-fanbase.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  JwtUser,
  JwtUserData,
} from '../../common/decorators/jwt-user.decorator';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Controller('fanbase')
export class FanbaseController {
  constructor(
    private readonly fanbaseService: FanbaseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Admin)
  @UseInterceptors(FileInterceptor('image'))
  async createFanbase(
    @Body() createFanbaseDto: CreateFanbaseDTO,
    @UploadedFile() file: any,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      console.log('Creating fanbase with data:', createFanbaseDto);
      console.log('User:', user);
      console.log(
        'File:',
        file ? `${file.originalname} (${file.size} bytes)` : 'No file',
      );

      // Extract user ID from JWT user data
      const userId = user.userId;

      let fanbasePhotoUrl = createFanbaseDto.fanbasePhotoUrl;

      // If a file was uploaded, upload to Cloudinary
      if (file) {
        fanbasePhotoUrl = await this.cloudinaryService.uploadImage(
          file,
          undefined, // folder not needed when using preset
          'fanbase_profile_image_preset',
        );
      }

      // Update DTO with uploaded URL
      const updatedDto = { ...createFanbaseDto, fanbasePhotoUrl };

      // Pass userId separately to service
      return await this.fanbaseService.create(updatedDto, userId);
    } catch (error) {
      console.error('Error creating fanbase:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getFanbaseById(@Param('id') id: string, @JwtUser() user: JwtUserData) {
    try {
      const fanbase = await this.fanbaseService.findById(id, user?.userId);
      if (!fanbase) {
        throw new HttpException('Fanbase not found', HttpStatus.NOT_FOUND);
      }
      return fanbase;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to fetch fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('name/:name')
  @UseGuards(JwtAuthGuard)
  async getFanbaseByName(
    @Param('name') name: string,
    @JwtUser() user?: JwtUserData,
  ) {
    try {
      const fanbase = await this.fanbaseService.findByName(name, user?.userId);
      if (!fanbase) {
        throw new HttpException('Fanbase not found', HttpStatus.NOT_FOUND);
      }
      return fanbase;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to fetch fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Main route that frontend calls - GET /fanbase
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllFanbases(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @JwtUser() user?: JwtUserData,
  ) {
    try {
      const skip = (page - 1) * limit;
      // Add isDeleted filter
      const filter = { isDeleted: { $ne: true } };
      return await this.fanbaseService.findAllWithPagination(
        filter,
        skip,
        limit,
        user?.userId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch fanbases: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
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
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinFanbase(
    @Param('id') fanbaseId: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      const userId = user.userId;
      return await this.fanbaseService.joinFanbase(fanbaseId, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to join fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likeFanbase(
    @Param('id') fanbaseId: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      const userId = user.userId;
      return await this.fanbaseService.likeFanbase(fanbaseId, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to like fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/isOwner')
  @UseGuards(JwtAuthGuard)
  async isOwner(@Param('id') fanbaseId: string, @JwtUser() user: JwtUserData) {
    try {
      const userId = user.userId;
      return await this.fanbaseService.isOwner(fanbaseId, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to check ownership: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':fanbaseId/rules')
  async addOrUpdateRules(
    @Param('fanbaseId') fanbaseId: string,
    @Body('rules') rules: { rule: string }[],
    @Req() req,
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.fanbaseService.addOrUpdateRules(fanbaseId, rules, userId);
  }

  @Get(':fanbaseId/rules')
  async getRules(@Param('fanbaseId') fanbaseId: string) {
    return this.fanbaseService.getRules(fanbaseId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':fanbaseId/rules/:ruleIndex')
  async removeRule(
    @Param('fanbaseId') fanbaseId: string,
    @Param('ruleIndex') ruleIndex: string,
    @Req() req,
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.fanbaseService.removeRule(
      fanbaseId,
      parseInt(ruleIndex),
      userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':fanbaseId')
  async deleteFanbase(@Param('fanbaseId') fanbaseId: string, @Req() req) {
    const userId = req.user?.userId || req.user?.id;
    return this.fanbaseService.deleteFanbase(fanbaseId, userId);
  }
}
