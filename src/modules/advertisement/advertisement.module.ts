import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdvertisementController } from './advertisement.controller';
import { AdvertisementService } from './advertisement.service';
import { Advertisement, AdvertisementSchema } from './advertisement.model';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Advertisement.name, schema: AdvertisementSchema },
    ]),
  ],
  controllers: [AdvertisementController],
  providers: [AdvertisementService, CloudinaryService],
})
export class AdvertisementModule {}
