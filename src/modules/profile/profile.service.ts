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

 
}
 