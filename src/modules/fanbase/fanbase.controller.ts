import { Controller, Get, Param, Post, Body, Patch, Query } from '@nestjs/common';
import { FanbaseService } from './fanbase.services';
import { CreateFanbaseDto } from './dto/create-fanbase.dto';

@Controller('fanbases')
export class FanbaseController {
  constructor(private readonly fanbaseService: FanbaseService) {}

  @Get()
  getAll() {
    return this.fanbaseService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.fanbaseService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFanbaseDto) {
    return this.fanbaseService.create(dto);
  }

  @Patch(':id/join')
  toggleJoin(@Param('id') id: string, @Query('userId') userId: string) {
    return this.fanbaseService.toggleJoin(id, userId);
  }
}
