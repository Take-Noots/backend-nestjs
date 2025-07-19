import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SongPostController } from './songPost.controller';
import { SongPostService } from './songPost.service';
import { SongPost, SongPostSchema } from './songPost.model';
import { UserModule } from '../user/user.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SongPost.name, schema: SongPostSchema },
    ]),
    UserModule,
    ProfileModule,
  ],
  controllers: [SongPostController],
  providers: [SongPostService],
  exports: [SongPostService],
})
export class SongPostModule {}
