import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FanbasePostController } from './fanbasePost.controller';
import { FanbasePostService } from './fanbasePost.service';
import { FanbasePost, FanbasePostSchema } from './fanbasePost.model';
import { User, UserSchema } from '../user/user.model';
import { Fanbase, FanbaseSchema } from '../fanbases/fanbase.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FanbasePost.name, schema: FanbasePostSchema },
      { name: User.name, schema: UserSchema },
      { name: Fanbase.name, schema: FanbaseSchema },
    ]),
  ],
  controllers: [FanbasePostController],
  providers: [FanbasePostService],
  exports: [FanbasePostService],
})
export class FanbasePostModule {}
