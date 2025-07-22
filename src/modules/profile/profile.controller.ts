import { Controller, Get, Param, Put, Body, Post } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileDto } from './dto/profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('posts/:userId')
  async getPostsByUserId(@Param('userId') userId: string) {
    return this.profileService.getPostsByUserId(userId);
  }

  @Put(':userId')
  async updateProfile(
    @Param('userId') userId: string,
    @Body() updateData: any,
  ) {
    // Pass username and fullName in updateData if present
    return this.profileService.updateProfileByUserId(userId, updateData);
  }

  @Get('post-stats/:userId')
  async getPostStatsByUserId(@Param('userId') userId: string) {
    return this.profileService.getPostStatsByUserId(userId);
  }

  @Get(':userId')
  async getProfileByUserId(
    @Param('userId') userId: string,
  ): Promise<ProfileDto | { message: string; error?: string }> {
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      return {
        message: 'Profile not found',
        error: 'Profile with the given userId does not exist',
      };
    }
    return profile;
  }

  @Post()
  async createProfile(
    @Body()
    createProfileDto: {
      userId: string;
      bio?: string;
      profileImage?: string;
      fullName?: string;
    },
  ) {
    return this.profileService.createProfile(createProfileDto);
  }

  @Get(':userId/post_count')
  async countPostsByUser(@Param('userId') userId: string) {
    const count = await this.profileService.countPostsByUser(userId);
    return { userId, postCount: count };
  }

  @Get(':userId/followers')
  async getFollowersListWithDetails(@Param('userId') userId: string) {
    return this.profileService.getFollowersListWithDetails(userId);
  }

  @Get(':userId/following')
  async getFollowingListWithDetails(@Param('userId') userId: string) {
    return this.profileService.getFollowingListWithDetails(userId);
  }
}
