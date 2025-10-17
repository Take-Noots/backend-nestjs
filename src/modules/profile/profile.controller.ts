import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { ProfileDto } from './dto/profile.dto';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  JwtUser,
  JwtUserData,
} from '../../common/decorators/jwt-user.decorator';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  // New endpoint for uploading profile picture
  @Post(':userId/upload-profile-picture')
  @UseInterceptors(FileInterceptor('profileImage'))
  async uploadProfilePicture(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        return {
          success: false,
          message: 'No file provided',
        };
      }

      // Upload to Cloudinary
      const imageUrl = await this.cloudinaryService.uploadImage(
        file,
        'profile_pictures',
      );

      // Update profile with new image URL
      const result = await this.profileService.updateProfileByUserId(userId, {
        profileImage: imageUrl,
      });

      return {
        success: true,
        message: 'Profile picture uploaded successfully',
        imageUrl,
        profile: result.profile,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to upload profile picture: ${error.message}`,
      };
    }
  }

  // New endpoint for uploading profile picture from base64
  @Post(':userId/upload-profile-picture-base64')
  async uploadProfilePictureBase64(
    @Param('userId') userId: string,
    @Body() body: { imageData: string },
  ) {
    try {
      if (!body.imageData) {
        return {
          success: false,
          message: 'No image data provided',
        };
      }

      // Upload to Cloudinary
      const imageUrl = await this.cloudinaryService.uploadImageFromBase64(
        body.imageData,
        'profile_pictures',
      );

      // Update profile with new image URL
      const result = await this.profileService.updateProfileByUserId(userId, {
        profileImage: imageUrl,
      });

      return {
        success: true,
        message: 'Profile picture uploaded successfully',
        imageUrl,
        profile: result.profile,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to upload profile picture: ${error.message}`,
      };
    }
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

  // Save a thoughts post for a user
  @Post(':userId/save-thoughts/:postId')
  async saveThoughtsPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    const success = await this.profileService.saveThoughtsPost(userId, postId);
    return { success, message: 'Thoughts post saved successfully' };
  }

  // Unsave a thoughts post for a user
  @Delete(':userId/save-thoughts/:postId')
  async unsaveThoughtsPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    const success = await this.profileService.unsaveThoughtsPost(userId, postId);
    return { success, message: 'Thoughts post unsaved successfully' };
  }

  // Check if a thoughts post is saved by a user
  @Get(':userId/saved-thoughts/:postId')
  async isThoughtsPostSaved(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    const isSaved = await this.profileService.isThoughtsPostSaved(userId, postId);
    return { isSaved };
  }

  // Get all saved thoughts posts for a user
  @Get(':userId/saved-thoughts-posts')
  async getSavedThoughtsPosts(@Param('userId') userId: string) {
    const savedPosts = await this.profileService.getSavedThoughtsPosts(userId);
    return { savedPosts };
  }
}
