import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UserModule } from '@modules/user/user.module';
import { SongPostModule } from '@modules/songPost/songPost.module';

@Module({
  imports: [UserModule, SongPostModule],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule {}
