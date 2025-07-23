
import { Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SongPost, SongPostDocument } from '@modules/songPost/songPost.model';
import { Profile, ProfileDocument } from '@modules/profile/profile.model';

@Injectable()
export class SearchService {
  constructor(
    private readonly userService: UserService,
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  async search(query: string) {
    let users: any[] = [];
    let songPosts: any[] = [];
    if (!query) {
      // Return all song posts sorted by date ascending
      songPosts = await this.songPostModel.find({}).sort({ createdAt: 1 }).exec();
    } else {
      users = await this.userService.findAllWithPagination({ username: { $regex: query, $options: 'i' } });
      songPosts = await this.songPostModel.find({
        $or: [
          { songName: { $regex: query, $options: 'i' } },
          { artists: { $regex: query, $options: 'i' } },
          { caption: { $regex: query, $options: 'i' } },
        ],
      }).exec();
    }

    // For each song post, fetch username and profile image using userId
    const songPostsWithUser = await Promise.all(songPosts.map(async post => {
      let username = '';
      let userImage = '';
      try {
        // Fetch user
        const user = post.userId ? await this.userService.findById(post.userId) : null;
        username = user?.username || 'Unknown User';
        // Fetch profile
        const profile = post.userId ? await this.profileModel.findOne({ userId: post.userId }).lean() : null;
        userImage = profile?.profileImage || '';
      } catch (e) {
        username = 'Unknown User';
        userImage = '';
      }
      return {
        id: post._id,
        name: post.songName,
        artists: post.artists,
        caption: post.caption,
        albumImage: post.albumImage,
        createdAt: post.createdAt,
        username,
        userImage,
        trackId: post.trackId,
      };
    }));
    return {
      users: users.map(user => ({ id: user._id, name: user.username, type: 'user' })),
      fanbases: [],
      posts: [],
      profiles: [],
      songPosts: songPostsWithUser,
    };
  }
}
