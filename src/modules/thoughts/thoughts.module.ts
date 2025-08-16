import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThoughtsController } from './thoughts.controller';
import { ThoughtsService } from './thoughts.service';
import { ThoughtsPost, ThoughtsPostSchema } from './thoughts.model';
import { UserModule } from '../user/user.module';
import { ProfileModule } from '../profile/profile.module';
import { FanbaseModule } from '../fanbases/fanbase.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ThoughtsPost.name, schema: ThoughtsPostSchema },
    ]),
    UserModule,
    ProfileModule,
    FanbaseModule,
  ],
  controllers: [ThoughtsController],
  providers: [ThoughtsService],
  exports: [ThoughtsService],
})
export class ThoughtsModule {}
