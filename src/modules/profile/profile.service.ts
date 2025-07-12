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

  async getProfileById(id: string): Promise<ProfileDto | null> {
    const profile = await this.profileModel.findById(id).lean();
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

  async getAlbumArtsById(userId: string): Promise<string[] | null> {
    // Find all song posts by userId and collect their albumImage fields
    const posts = await this.songPostModel
      .find({ userId }, 'albumImage')
      .lean();
    if (!posts) return null;
    // Filter out undefined/null albumImage and return only valid links
    return posts
      .map((post) => post.albumImage)
      .filter(
        (img): img is string => typeof img === 'string' && img.length > 0,
      );
  }
}
