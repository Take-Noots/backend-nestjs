import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FanbasePost, FanbasePostDocument } from './fanbasePost.model';
import { User, UserDocument } from '../user/user.model';
import { Fanbase, FanbaseDocument } from '../fanbases/fanbase.model';
import { CreateFanbasePostDto } from './dto/create-fanbasePost.dto';
import { PostType } from '../../common/interfaces/fanbasepost.interface';

@Injectable()
export class FanbasePostService {
  constructor(
    @InjectModel(FanbasePost.name) private fanbasePostModel: Model<FanbasePostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Fanbase.name) private fanbaseModel: Model<FanbaseDocument>,
  ) {}

  async create(createPostDto: CreateFanbasePostDto, userId: string): Promise<PostType> {
    try {
      // Get user details
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify fanbase exists
      const fanbase = await this.fanbaseModel.findById(createPostDto.fanbaseId).exec();
      if (!fanbase) {
        throw new NotFoundException('Fanbase not found');
      }

      // Create the post
      const postData = {
        ...createPostDto,
        createdBy: {
          userId: user._id.toString(),
          userName: user.username,
        },
        likesCount: 0,
        likeUserIds: [],
        commentsCount: 0,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdPost = new this.fanbasePostModel(postData);
      const savedPost = await createdPost.save();

      return this.toPostType(savedPost, userId);
    } catch (error) {
      throw new Error(`Failed to create fanbase post: ${error.message}`);
    }
  }

  async findByFanbaseId(fanbaseId: string, userId?: string, page: number = 1, limit: number = 10): Promise<PostType[]> {
    try {
      const skip = (page - 1) * limit;
      
      const posts = await this.fanbasePostModel
        .find({ fanbaseId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      return posts.map(post => this.toPostType(post, userId));
    } catch (error) {
      throw new Error(`Failed to fetch fanbase posts: ${error.message}`);
    }
  }

  async findById(postId: string, userId?: string): Promise<PostType> {
    try {
      const post = await this.fanbasePostModel.findById(postId).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      return this.toPostType(post, userId);
    } catch (error) {
      throw new Error(`Failed to fetch post: ${error.message}`);
    }
  }

  async likePost(postId: string, userId: string): Promise<PostType> {
    try {
      const post = await this.fanbasePostModel.findById(postId).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const userAlreadyLiked = post.likeUserIds.includes(userId);

      if (userAlreadyLiked) {
        // Unlike the post
        post.likeUserIds = post.likeUserIds.filter(id => id !== userId);
        post.likesCount = Math.max(0, post.likesCount - 1);
      } else {
        // Like the post
        post.likeUserIds.push(userId);
        post.likesCount += 1;
      }

      post.updatedAt = new Date();
      const updatedPost = await post.save();

      return this.toPostType(updatedPost, userId);
    } catch (error) {
      throw new Error(`Failed to like/unlike post: ${error.message}`);
    }
  }

  async addComment(postId: string, comment: string, userId: string): Promise<PostType> {
    try {
      const post = await this.fanbasePostModel.findById(postId).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newComment = {
        userId: user._id.toString(),
        userName: user.username,
        comment: comment.trim(),
        likeCount: 0,
        likeUserIds: [],
        createdAt: new Date(),
      };

      post.comments.push(newComment);
      post.commentsCount = post.comments.length;
      post.updatedAt = new Date();

      const updatedPost = await post.save();
      return this.toPostType(updatedPost, userId);
    } catch (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  private toPostType(post: FanbasePostDocument, userId?: string): PostType {
    return {
      _id: (post._id as Types.ObjectId).toString(),
      createdBy: post.createdBy,
      topic: post.topic,
      description: post.description,
      spotifyTrackId: post.spotifyTrackId,
      songName: post.songName,
      artistName: post.artistName,
      albumArt: post.albumArt,
      likesCount: post.likesCount || 0,
      likeUserIds: post.likeUserIds || [],
      isLiked: userId ? post.likeUserIds.includes(userId) : false,
      commentsCount: post.commentsCount || 0,
      comments: post.comments || [],
      fanbaseId: post.fanbaseId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
