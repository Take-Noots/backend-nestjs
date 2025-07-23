import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UserModule } from '@modules/user/user.module';
import { SongPostModule } from '@modules/songPost/songPost.module';
import { Profile, ProfileSchema } from '@modules/profile/profile.model';

@Module({
  imports: [
    UserModule,
    SongPostModule,
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
  ],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule {}
