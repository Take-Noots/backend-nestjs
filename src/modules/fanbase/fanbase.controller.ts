import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FanbaseService } from './fanbase.services';
import { CreateFanbaseDto } from './dto/create-fanbase.dto';
import { Fanbase } from './entities/fanbase.entity';

@Controller('fanbase')
export class FanbaseController {
  constructor(private readonly fanbaseService: FanbaseService) {}

  @Post()
  async create(@Body() dto: CreateFanbaseDto): Promise<Fanbase> {
    return this.fanbaseService.create(dto);
  }

  @Get()
  async findAll(): Promise<Fanbase[]> {
    return this.fanbaseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Fanbase> {
    return this.fanbaseService.findOne(id);
  }
}
