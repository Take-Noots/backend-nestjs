import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './profile.model';
import { ProfileDto } from './dto/profile.dto';
import { SongPost, SongPostDocument } from '../songPost/songPost.model';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
  ) {}

  async getProfileByUserId(userId: string): Promise<ProfileDto | null> {
    const profile = await this.profileModel.findOne({ userId }).lean();
    if (!profile) return null;

    return {
      _id: profile._id,
      userId: profile.userId,
      username: profile.username,
      profileImage: profile.profileImage ?? '',
      bio: profile.bio ?? '',
      posts: profile.posts,
      followers: profile.followers,
      following: profile.following,
      albumArts: profile.albumArts,
    };
  }

  async getPostsByUserId(userId: string) {
    return this.songPostModel.find({ userId }).lean();
  }

  async updateProfileByUserId(userId: string, updateData: any) {
    // Only allow updating certain fields
    const allowedFields = ['name', 'username', 'bio', 'profileImage'];
    const update: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Map 'name' to 'username' if needed
        if (field === 'name') {
          update['username'] = updateData['name'];
        } else {
          update[field] = updateData[field];
        }
      }
    }
    update.updatedAt = new Date();

    const result = await this.profileModel
      .findOneAndUpdate({ userId }, { $set: update }, { new: true })
      .lean();

    if (!result) {
      return { success: false, message: 'Profile not found' };
    }
    return {
      success: true,
      message: 'Profile updated successfully',
      profile: result,
    };
  }
}
