import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdvertisementController } from './advertisement.controller';
import { AdvertisementService } from './advertisement.service';
import { Advertisement, AdvertisementSchema } from './advertisement.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Advertisement.name, schema: AdvertisementSchema }]),
  ],
  controllers: [AdvertisementController],
  providers: [AdvertisementService],
})
export class AdvertisementModule {}
