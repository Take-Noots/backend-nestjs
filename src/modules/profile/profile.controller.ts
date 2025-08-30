import { Controller, Get, Param, Put, Body, Post, Delete } from '@nestjs/common';
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
    // Ensure email is included in the returned profile object
    // If your ProfileDto/service already includes email, no change needed
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
      userType?: string;
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

  // Save a post
  @Post(':userId/save/:postId')
  async savePost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    const success = await this.profileService.savePost(userId, postId);
    return {
      success,
      message: success ? 'Post saved successfully' : 'Failed to save post',
    };
  }

  // Unsave a post
  @Delete(':userId/save/:postId')
  async unsavePost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    const success = await this.profileService.unsavePost(userId, postId);
    return {
      success,
      message: success ? 'Post unsaved successfully' : 'Failed to unsave post',
    };
  }

  // Check if a post is saved
  @Get(':userId/saved/:postId')
  async isPostSaved(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    const isSaved = await this.profileService.isPostSaved(userId, postId);
    return { isSaved };
  }

  // Get all saved posts for a user
  @Get(':userId/saved-posts')
  async getSavedPosts(@Param('userId') userId: string) {
    const savedPosts = await this.profileService.getSavedPosts(userId);
    return { savedPosts };
  }
}
