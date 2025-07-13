import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule {}
