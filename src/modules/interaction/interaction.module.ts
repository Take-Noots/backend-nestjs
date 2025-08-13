import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecentlyLikedUserList, RecentlyLikedUserListSchema } from './interaction.model';
import { RecentlyLikedUserService } from './interaction.service';
import { RecentlyLikedUserController } from './interaction.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecentlyLikedUserList.name, schema: RecentlyLikedUserListSchema },
    ]),
  ],
  providers: [RecentlyLikedUserService],
  controllers: [RecentlyLikedUserController],
  exports: [RecentlyLikedUserService],
})
export class RecentlyLikedUserModule {}
