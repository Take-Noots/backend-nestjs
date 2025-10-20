import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DesSongPostController } from './desSongPost.controller';
import { DesSongPostService } from './desSongPost.service';
import { DesSongPost, DesSongPostSchema } from './desSongPost.model';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DesSongPost.name, schema: DesSongPostSchema },
    ]),
    UserModule,
    NotificationModule,
  ],
  controllers: [DesSongPostController],
  providers: [DesSongPostService],
  exports: [DesSongPostService],
})
export class DesSongPostModule {}
