import { Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SongPost, SongPostDocument } from '@modules/songPost/songPost.model';

@Injectable()
export class SearchService {
  constructor(
    private readonly userService: UserService,
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
  ) {}

  async search(query: string) {
    if (!query) {
      return {
        users: [],
        fanbases: [],
        posts: [],
        profiles: [],
        songPosts: [],
      };
    }
    const users = await this.userService.findAllWithPagination({ username: { $regex: query, $options: 'i' } });
    const songPosts = await this.songPostModel.find({
      $or: [
        { songName: { $regex: query, $options: 'i' } },
        { artists: { $regex: query, $options: 'i' } },
        { caption: { $regex: query, $options: 'i' } },
      ],
    }).exec();

    return {
      users: users.map(user => ({ id: user._id, name: user.username, type: 'user' })),
      fanbases: [],
      posts: [],
      profiles: [],
      songPosts: songPosts.map(post => ({
        id: post._id,
        name: post.songName,
        artists: post.artists,
        caption: post.caption,
      })),
    };
  }
}
