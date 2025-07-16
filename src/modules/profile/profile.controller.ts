import { Controller, Get, Param, Put, Body } from '@nestjs/common';
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
    return this.profileService.updateProfileByUserId(userId, updateData);
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
}
