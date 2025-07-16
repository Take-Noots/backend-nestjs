import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './profile.model';
import { ProfileDto } from './dto/profile.dto';
import { SongPost, SongPostDocument } from '../songPost/songPost.model';
import { User, UserDocument } from '../user/user.model'; // <-- fix import

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>, // <-- inject User model
  ) {}

  async getProfileByUserId(userId: string): Promise<ProfileDto | null> {
    // Find the user first to ensure the user exists and get the username
    const user = await this.userModel.findById(userId).lean();
    if (!user || !user.username) return null;

    const email = await this.userModel.findById(userId).select('email').lean();
    if (!email) return null;
    // Then find the profile
    const profile = await this.profileModel.findOne({ userId }).lean();
    if (!profile) return null;

    return {
      _id: profile._id,
      userId: profile.userId,
      username: user.username,
      email: user.email ?? '',
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
    // Only allow updating certain fields (remove username)
    const allowedFields = ['name', 'bio', 'profileImage'];
    const update: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Map 'name' to nothing, since username is not stored in profile anymore
        if (field === 'name') {
          // Do nothing, username is not stored in profile
        } else {
          update[field] = updateData[field];
        }
      }
    }
    update.updatedAt = new Date();

    // Debug: log userId and update object
    console.log('Updating profile for userId:', userId, 'with:', update);

    try {
      const result = await this.profileModel
        .findOneAndUpdate({ userId: userId }, { $set: update }, { new: true })
        .lean();

      if (!result) {
        return { success: false, message: 'Profile not found' };
      }
      // Fetch username from users collection for response
      const user = await this.userModel.findById(result.userId).lean();

      return {
        success: true,
        message: 'Profile updated successfully',
        profile: {
          ...result,
          username: user?.username ?? '',
        },
      };
    } catch (err) {
      // Log error for debugging
      console.error('Profile update error:', err);
      return {
        success: false,
        message: 'Failed to update profile',
        error: err?.message,
      };
    }
  }
}
