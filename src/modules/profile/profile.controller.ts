import { Controller, Get, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileDto } from './dto/profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  async getProfile(
    @Param('id') id: string,
  ): Promise<ProfileDto | { message: string }> {
    const profile = await this.profileService.getProfileById(id);
    if (!profile) {
      return { message: 'Profile not found' };
    }
    return profile;
  }

  @Get(':userId/album-arts')
  async getAlbumArts(
    @Param('userId') userId: string,
  ): Promise<{ albumArts: string[] } | { message: string }> {
    const albumArts = await this.profileService.getAlbumArtsById(userId);
    if (!albumArts) {
      return { message: 'No album arts found for this user' };
    }
    return { albumArts };
  }
}
