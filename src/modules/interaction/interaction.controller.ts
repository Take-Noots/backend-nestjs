import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RecentlyLikedUserService } from './interaction.service';

@Controller('recently-liked-users')
export class RecentlyLikedUserController {
  constructor(private readonly service: RecentlyLikedUserService) {}

  @Post()
  async addInteraction(
    @Body() body: { userId: string; likedPostId: string }
  ) {
    console.log('Received addInteraction:', body);
    return this.service.addInteraction(body.userId, body.likedPostId);
  }

  @Get(':userId')
  async getRecentlyLikedUsers(@Param('userId') userId: string) {
    return this.service.getRecentlyLikedUsers(userId);
  }
}
