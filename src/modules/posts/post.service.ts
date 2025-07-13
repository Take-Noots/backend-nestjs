// src/modules/posts/post.service.ts
import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from './post.model';
import { CreatePostDTO } from './dto/create-post.dto';
import { PostType } from '../../common/interfaces/post.interface';

@Injectable()
export class PostService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(createPostDto: CreatePostDTO): Promise<PostType> {
    const createdPost = new this.postModel(createPostDto);
    const savedPost = await createdPost.save();
    return this.toPostType(savedPost);
  }

  async findById(id: string): Promise<PostType | null> {
    const post = await this.postModel.findById(id).exec();
    return post ? this.toPostType(post) : null;
  }

  async findByUserId(userId: string): Promise<PostType[]> {
    const posts = await this.postModel.find({ 
      userId, 
      isDeleted: { $ne: true } 
    }).exec();
    return posts.map(post => this.toPostType(post));
  }

  // ===== ADMIN FUNCTIONALITY - PAGINATION AND FILTERING =====
  async findAllWithPagination(filter: any = {}, skip: number = 0, limit: number = 10): Promise<PostType[]> {
    const posts = await this.postModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('userId', 'username email')
      .populate('fanbaseId', 'name')
      .exec();
    return posts.map(post => this.toPostType(post));
  }

  async countPosts(filter: any = {}): Promise<number> {
    return await this.postModel.countDocuments(filter).exec();
  }

  // ===== ADMIN FUNCTIONALITY - CONTENT MODERATION =====
  async deletePost(postId: string, deletedBy: string, reason: string): Promise<PostType> {
    const updatedPost = await this.postModel.findByIdAndUpdate(
      postId,
      {
        isDeleted: true,
        deletedReason: reason,
        deletedBy: deletedBy,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
    
    if (!updatedPost) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }
    
    return this.toPostType(updatedPost);
  }

  async restorePost(postId: string): Promise<PostType> {
    const updatedPost = await this.postModel.findByIdAndUpdate(
      postId,
      {
        $unset: {
          isDeleted: 1,
          deletedReason: 1,
          deletedBy: 1
        },
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
    
    if (!updatedPost) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }
    
    return this.toPostType(updatedPost);
  }

  // ===== ADMIN FUNCTIONALITY - METRICS =====
  async countRecentPosts(days: number): Promise<number> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return await this.postModel.countDocuments({
      createdAt: { $gte: dateFrom },
      isDeleted: { $ne: true }
    }).exec();
  }

  async getPostGrowthData(days: number): Promise<any[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: dateFrom },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 as 1 }
      }
    ];

    return await this.postModel.aggregate(pipeline).exec();
  }

  async getTopPosts(limit: number = 10): Promise<PostType[]> {
    const posts = await this.postModel.find({ 
      isDeleted: { $ne: true } 
    })
      .sort({ likesCount: -1, commentsCount: -1 })
      .limit(limit)
      .populate('userId', 'username')
      .exec();
    return posts.map(post => this.toPostType(post));
  }

  private toPostType(post: PostDocument): PostType {
    return {
      _id: post._id.toString(),
      userId: post.userId?.toString(),
      description: post.description,
      postType: post.postType,
      spotifyTrackId: post.spotifyTrackId,
      songTitle: post.songTitle,
      artistName: post.artistName,
      albumArt: post.albumArt,
      albumName: post.albumName,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      fanbaseId: post.fanbaseId?.toString(),
      isReported: post.isReported,
      isDeleted: post.isDeleted,
      deletedReason: post.deletedReason,
      deletedBy: post.deletedBy?.toString(),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}