// src/modules/fanbases/fanbase.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FanbaseService } from './fanbase.service';
import { FanbaseController } from './fanbase.controller';
import { Fanbase, FanbaseSchema } from './fanbase.model';

@Module({
  imports: [MongooseModule.forFeature([{ name: Fanbase.name, schema: FanbaseSchema }])],
  controllers: [FanbaseController], 
  providers: [FanbaseService],
  exports: [FanbaseService],
})
export class FanbaseModule {}