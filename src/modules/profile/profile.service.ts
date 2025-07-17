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

      // NEWLY ADDED CONTENT ---
      username: user.username,
      email: user.email ?? '',
      // ---

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
    const allowedProfileFields = ['bio', 'profileImage'];
    const profileUpdate: any = {};

    for (const field of allowedProfileFields) {
      if (updateData[field] !== undefined) {
        profileUpdate[field] = updateData[field];
      }
    }
    profileUpdate.updatedAt = new Date();

    // Update username and email in User collection
    const userUpdate: any = {};
    if (updateData.username !== undefined)
      userUpdate.username = updateData.username;
    if (updateData.email !== undefined) userUpdate.email = updateData.email;

    if (Object.keys(userUpdate).length > 0) {
      await this.userModel.updateOne({ _id: userId }, { $set: userUpdate });
    }

    const updatedProfile = await this.profileModel
      .findOneAndUpdate({ userId }, { $set: profileUpdate }, { new: true })
      .lean();

    if (!updatedProfile) {
      return { success: false, message: 'Profile not found' };
    }

    const user = await this.userModel.findById(userId).lean();

    return {
      success: true,
      message: 'Profile updated successfully',
      profile: {
        ...updatedProfile,
        email: user?.email ?? '',
        username: user?.username ?? '',
      },
    };
  }

  async createProfile(createProfileDto: {
    userId: string;
    bio?: string;
    profileImage?: string;
  }) {
    const { userId, bio, profileImage } = createProfileDto;

    // Check if profile already exists
    const existingProfile = await this.profileModel.findOne({ userId }).lean();
    if (existingProfile) {
      return {
        success: false,
        message: 'Profile already exists for this user',
      };
    }

    // Optionally, check if user exists
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const profile = new this.profileModel({
      userId,
      bio: bio ?? '',
      profileImage: profileImage ?? '',
      posts: 0,
      followers: [],
      following: [],
      albumArts: [],
    });

    await profile.save();

    return { success: true, message: 'Profile created successfully', profile };
  }

  // COMMENTED OUT THIS FUNCTION... UNCOMMENT IF NEEDED
  async addFollowers(userId: string, followerId: string): Promise<void> {
    // Add followerId to userId's followers array
    await this.profileModel.updateOne(
      { userId },
      { $addToSet: { followers: followerId } },
    );
    // Add userId to followerId's following array
    await this.profileModel.updateOne(
      { userId: followerId },
      { $addToSet: { following: userId } },
    );
  }
}
