// src/modules/fanbases/fanbase.controller.ts
import { Controller, Get, Post, Delete, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { FanbaseService } from './fanbase.service';
import { CreateFanbaseDTO } from './dto/create-fanbase.dto';

@Controller('fanbase') // Changed from 'fanbases' to 'fanbase' to match frontend
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
      console.log("CALLING GET FANBASE BY ID", id);
      const fanbase = await this.fanbaseService.findById(id);
      console.log("FANBASE FOUND", fanbase);
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