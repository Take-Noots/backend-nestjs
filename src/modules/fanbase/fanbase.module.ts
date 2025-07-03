// src/fanbase/fanbase.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { FanbaseService } from './fanbase.services';
import { CreateFanbaseDto } from './dto/create-fanbase.dto';
import { Fanbase } from './entities/fanbase.entity';

@Controller('fanbase')
export class FanbaseController {
  constructor(private readonly fanbaseService: FanbaseService) {}

  @Post()
  async createFanbase(@Body() dto: CreateFanbaseDto): Promise<Fanbase> {
    // Later: add logic to check post existence and auto-fill description
    return this.fanbaseService.create(dto);
  }
}
