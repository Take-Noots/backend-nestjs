// src/modules/fanbases/fanbase.controller.ts
import { Controller, Get, Post, Delete, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { FanbaseService } from './fanbase.service';
import { CreateFanbaseDTO } from './dto/create-fanbase.dto';

@Controller('fanbases')
export class FanbaseController {
  constructor(private readonly fanbaseService: FanbaseService) {}

  @Post()
  async createFanbase(@Body() createFanbaseDto: CreateFanbaseDTO) {
    try {
      return await this.fanbaseService.create(createFanbaseDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getFanbaseById(@Param('id') id: string) {
    try {
      const fanbase = await this.fanbaseService.findById(id);
      if (!fanbase) {
        throw new HttpException('Fanbase not found', HttpStatus.NOT_FOUND);
      }
      return fanbase;
    } catch (error) {
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
      throw new HttpException(
        `Failed to fetch fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async getAllFanbases(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string
  ) {
    try {
      const skip = (page - 1) * limit;
      const filter = category ? { category, isDeleted: false, isActive: true } : { isDeleted: false, isActive: true };
      return await this.fanbaseService.findAllWithPagination(filter, skip, limit);
    } catch (error) {
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
      throw new HttpException(
        `Failed to fetch top fanbases: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}