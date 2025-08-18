import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ThoughtsPost, ThoughtsPostDocument } from './thoughts.model';
import { CreateThoughtsDto, AddThoughtsCommentDto, LikeThoughtsDto } from './dto/create-thoughts.dto';
import { UserService } from '../user/user.service';
import { ProfileService } from '../profile/profile.service';
import { FanbaseService } from '../fanbases/fanbase.service';

@Injectable()
export class ThoughtsService {
  constructor(
    @InjectModel(ThoughtsPost.name)
    private readonly thoughtsModel: Model<ThoughtsPostDocument>,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly fanbaseService: FanbaseService,
  ) {}

  // Create a new thoughts post
  async createThoughts(dto: CreateThoughtsDto & { fanbaseName?: string }): Promise<any> {
    console.log('Creating thoughts post:', dto);

    // If fanbaseName is provided but not FanbaseID, look up the ID
    if (dto.fanbaseName && !dto.FanbaseID) {
      const fanbase = await this.fanbaseService.findByName(dto.fanbaseName);
      if (fanbase && fanbase._id) {
        dto.FanbaseID = fanbase._id;
        dto.inAFanbase = true;
      } else {
        // Optionally throw or just continue without fanbase
        console.warn('Fanbase not found for name:', dto.fanbaseName);
      }
    }

    const thoughtsPost = new this.thoughtsModel({
      ...dto,
      songName: dto.songName,
      artistName: dto.artistName,
      trackId: dto.trackId,
      likes: 0,
      likedBy: [],
      comments: [],
    });
    const savedPost = await thoughtsPost.save();
    console.log('Thoughts post created successfully:', savedPost._id);
    
    // Return with username and postType
    const username = await this.userService.getUsernameById(savedPost.userId);
    return {
      ...savedPost.toObject(),
      username: username || '',
      postType: 'thoughts',
    };
  }

  // Get thoughts posts by multiple user IDs (for followers) - MAIN METHOD
  async getPostsByUserIds(userIds: string[]): Promise<any[]> {
    // Find posts where userId is in the userIds array
    const posts = await this.thoughtsModel
      .find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();
    
    // Attach username for each post
    const postsWithUsernames = await Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        return {
          ...post,
          username: username || '',
          postType: 'thoughts',
        };
      }),
    );
    
    return postsWithUsernames;
  }

  // Get thoughts post by ID (for individual post viewing)
  async findById(id: string): Promise<any> {
    const post = await this.thoughtsModel.findById(id).lean();
    if (!post) return null;
    
    const username = await this.userService.getUsernameById(post.userId);
    return {
      ...post,
      username: username || '',
      postType: 'thoughts',
    };
  }

  // Get thoughts posts by user ID (for user profile)
  async findByUserId(userId: string): Promise<any[]> {
    const posts = await this.thoughtsModel.find({ userId }).sort({ createdAt: -1 }).lean();
    
    // Attach username for each post
    const postsWithUsernames = await Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        return {
          ...post,
          username: username || '',
          postType: 'thoughts',
        };
      }),
    );
    
    return postsWithUsernames;
  }

  // Like a thoughts post
  async likePost(postId: string, dto: LikeThoughtsDto): Promise<any> {
    const post = await this.thoughtsModel.findById(postId);
    if (!post) return null;

    const index = post.likedBy.indexOf(dto.userId);
    if (index === -1) {
      post.likedBy.push(dto.userId);
    } else {
      post.likedBy.splice(index, 1);
    }
    post.likes = post.likedBy.length;
    await post.save();
    
    // Return with username and postType
    const username = await this.userService.getUsernameById(post.userId);
    return {
      ...post.toObject(),
      username: username || '',
      postType: 'thoughts',
    };
  }

  // Add comment to thoughts post
  async addComment(postId: string, dto: AddThoughtsCommentDto): Promise<any> {
    const post = await this.thoughtsModel.findById(postId);
    if (!post) throw new NotFoundException('Thoughts post not found');

    // Get username for the comment
    const username = await this.userService.getUsernameById(dto.userId);

    const comment = {
      id: new Types.ObjectId(),
      userId: dto.userId,
      username: username || '',
      text: dto.text,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      likedBy: [],
    };

    post.comments.push(comment);
    await post.save();
    console.log('Comment added to thoughts post:', comment);
    return comment;
  }

  // Delete thoughts post
  async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await this.thoughtsModel.findById(postId);
    if (!post || post.userId !== userId) return false;

    await this.thoughtsModel.findByIdAndDelete(postId);
    return true;
  }

  // Get thoughts posts from followers
  async getFollowerPosts(userId: string): Promise<any[]> {
    // 1. Get followers
    const followers = await this.profileService.getFollowers(userId);
    
    // 2. Get thoughts posts by followers
    const thoughtsPosts = await this.getPostsByUserIds(followers);
    
    // 3. Sort by creation date (newest first)
    const sortedPosts = thoughtsPosts.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    console.log('Follower thoughts posts:', sortedPosts.length);
    return sortedPosts;
  }
}
