import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Profile, ProfileSchema } from './profile.model';
import { SongPost, SongPostSchema } from '../songPost/songPost.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: SongPost.name, schema: SongPostSchema },
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
