import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Fanbase, FanbaseSchema } from './entities/fanbase.entity';
import { FanbaseController } from './fanbase.controller';
import { FanbaseService } from './fanbase.services';

@Module({
  imports: [MongooseModule.forFeature([{ name: Fanbase.name, schema: FanbaseSchema }])],
  controllers: [FanbaseController],
  providers: [FanbaseService],
})
export class FanbaseModule {}
