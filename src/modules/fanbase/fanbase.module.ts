import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FanbaseController } from './fanbase.controller';
import { FanbaseService } from './fanbase.services';
import { Fanbase, FanbaseSchema } from './entities/fanbase.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Fanbase.name, schema: FanbaseSchema }]),
  ],
  controllers: [FanbaseController],
  providers: [FanbaseService],
})
export class FanbaseModule {}
