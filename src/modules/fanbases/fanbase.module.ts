import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FanbaseService } from './fanbase.service';
import { FanbaseController } from './fanbase.controller';
import { Fanbase, FanbaseSchema } from './fanbase.model';
import { User, UserSchema } from '../user/user.model';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Fanbase.name, schema: FanbaseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FanbaseController],
  providers: [FanbaseService, CloudinaryService],
  exports: [FanbaseService],
})
export class FanbaseModule {}
