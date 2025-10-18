import { Controller, Get, Post, Delete, Param, Body, HttpException, HttpStatus, Request, UseGuards, UsePipes } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { AdvertisementService } from './advertisement.service';
import { CreateAdvertisementDTO } from './dto/create-advertisement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('advertisement')
export class AdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createAdvertisement(@Request() req, @Body() createAdvertisementDto: CreateAdvertisementDTO) {
    try {
      const advertisementData = {
        ...createAdvertisementDto,
        userId: req.user.userId // Use the userId from the authenticated user
      };
      return await this.advertisementService.create(advertisementData);
    } catch (error) {
      throw new HttpException(
        `Failed to create advertisement: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getAdvertisementById(@Param('id') id: string) {
    try {
      const advertisement = await this.advertisementService.findById(id);
      if (!advertisement) {
        throw new HttpException('Advertisement not found', HttpStatus.NOT_FOUND);
      }
      return advertisement;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch advertisement: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('user/:userId')
  async getAdvertisementsByUser(@Param('userId') userId: string) {
    try {
      return await this.advertisementService.findByUserId(userId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch user advertisements: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async getAllAdvertisements() {
    try {
      return await this.advertisementService.findAll();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch advertisements: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  async deleteAdvertisement(@Param('id') id: string) {
    try {
      const deletedAdvertisement = await this.advertisementService.delete(id);
      if (!deletedAdvertisement) {
        throw new HttpException('Advertisement not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Advertisement deleted successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to delete advertisement: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
