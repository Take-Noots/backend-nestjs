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

      //update postIds in fanbase
      fanbase.postIds.push((savedPost._id as Types.ObjectId).toString());
      fanbase.numberOfPosts = fanbase.postIds.length;
      await fanbase.save();

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
        _id: new Types.ObjectId(),
        userId: user._id.toString(),
        userName: user.username,
        comment: comment.trim(),
        likeCount: 0,
        likeUserIds: [],
        subComments: [],
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

  async addSubComment(postId: string, comment: string, userId: string, commentId: string): Promise<PostType> {
    try {
      const post = await this.fanbasePostModel.findById(postId).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // ✅ Find comment by _id instead of index
      const parentComment = post.comments.find(c => 
        (c._id as Types.ObjectId).toString() === commentId
      );
      
      if (!parentComment) {
        throw new NotFoundException('Comment not found');
      }

      const newSubComment = {
        _id: new Types.ObjectId(),
        userId: user._id.toString(),
        userName: user.username,
        comment: comment.trim(),
        likeCount: 0,
        likeUserIds: [],
        createdAt: new Date(),
      };

      parentComment.subComments.push(newSubComment);
      post.updatedAt = new Date();

      const updatedPost = await post.save();
      return this.toPostType(updatedPost, userId);
    } catch (error) {
      throw new Error(`Failed to add sub-comment: ${error.message}`);
    }
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      const post = await this.fanbasePostModel.findById(postId).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.createdBy.userId !== userId) {
        throw new NotFoundException('Unauthorized to delete this post');
      }

      // Delete the post
      await this.fanbasePostModel.deleteOne({ _id: postId }).exec();

      // Update postIds in the associated fanbase (if exists)
      const fanbase = await this.fanbaseModel.findById(post.fanbaseId).exec();
      if (fanbase) {
        fanbase.postIds = (fanbase.postIds || []).filter(id => id.toString() !== postId);
        fanbase.numberOfPosts = fanbase.postIds.length;
        await fanbase.save();
      }
    } catch (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  async deleteComment(postId: string, commentId: string, userId: string): Promise<PostType> {
    try {
      const post = await this.fanbasePostModel.findById(postId).exec(); 
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      
      // ✅ Find comment by _id
      const commentIndex = post.comments.findIndex(c => 
        (c._id as Types.ObjectId).toString() === commentId
      );
      
      if (commentIndex === -1) {
        throw new NotFoundException('Comment not found');
      }

      const comment = post.comments[commentIndex];
      if (comment.userId !== userId) {
        throw new NotFoundException('Unauthorized to delete this comment');
      }
      
      post.comments.splice(commentIndex, 1);
      post.commentsCount = post.comments.length;
      post.updatedAt = new Date();
      const updatedPost = await post.save();

      return this.toPostType(updatedPost, userId);
    } catch (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  async deleteSubComment(postId: string, commentId: string, subCommentId: string, userId: string): Promise<PostType> {
    try {
      const post = await this.fanbasePostModel.findById(postId).exec(); 
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      
      // ✅ Find parent comment by _id
      const parentComment = post.comments.find(c => 
        (c._id as Types.ObjectId).toString() === commentId
      );
      
      if (!parentComment) {
        throw new NotFoundException('Comment not found');
      }
      
      // ✅ Find sub-comment by _id
      const subCommentIndex = parentComment.subComments.findIndex(sc =>
        (sc._id as Types.ObjectId).toString() === subCommentId
      );
      
      if (subCommentIndex === -1) {
        throw new NotFoundException('Sub-comment not found');
      }

      const subComment = parentComment.subComments[subCommentIndex];
      if (subComment.userId !== userId) {
        throw new NotFoundException('Unauthorized to delete this sub-comment');
      }
      
      parentComment.subComments.splice(subCommentIndex, 1);
      post.updatedAt = new Date();
      const updatedPost = await post.save();
      return this.toPostType(updatedPost, userId);
    } catch (error) {
      throw new Error(`Failed to delete sub-comment: ${error.message}`);
    }
  }

  async likeComment(postId: string, commentId: string, userId: string): Promise<PostType> {
    try {
      const post = await this.fanbasePostModel.findById(postId).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // ✅ Find comment by _id
      const comment = post.comments.find(c => 
        (c._id as Types.ObjectId).toString() === commentId
      );
      
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      const userAlreadyLiked = comment.likeUserIds.includes(userId);

      if (userAlreadyLiked) {
        // Unlike the comment
        comment.likeUserIds = comment.likeUserIds.filter(id => id !== userId);
        comment.likeCount = Math.max(0, comment.likeCount - 1);
      } else {
        // Like the comment
        comment.likeUserIds.push(userId);
        comment.likeCount += 1;
      }

      post.updatedAt = new Date();
      const updatedPost = await post.save();

      return this.toPostType(updatedPost, userId);
    } catch (error) {
      throw new Error(`Failed to like/unlike comment: ${error.message}`);
    }
  }

  async likeSubComment(postId: string, commentId: string, subCommentId: string, userId: string): Promise<PostType> {
    try {
      const post = await this.fanbasePostModel.findById(postId).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // ✅ Find parent comment by _id
      const parentComment = post.comments.find(c => 
        (c._id as Types.ObjectId).toString() === commentId
      );
      
      if (!parentComment) {
        throw new NotFoundException('Comment not found');
      }

      // ✅ Find sub-comment by _id
      const subComment = parentComment.subComments.find(sc =>
        (sc._id as Types.ObjectId).toString() === subCommentId
      );
      
      if (!subComment) {
        throw new NotFoundException('Sub-comment not found');
      }

      const userAlreadyLiked = subComment.likeUserIds.includes(userId);

      if (userAlreadyLiked) {
        // Unlike the sub-comment
        subComment.likeUserIds = subComment.likeUserIds.filter(id => id !== userId);
        subComment.likeCount = Math.max(0, subComment.likeCount - 1);
      } else {
        // Like the sub-comment
        subComment.likeUserIds.push(userId);
        subComment.likeCount += 1;
      }

      post.updatedAt = new Date();
      const updatedPost = await post.save();

      return this.toPostType(updatedPost, userId);
    } catch (error) {
      throw new Error(`Failed to like/unlike sub-comment: ${error.message}`);
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
      comments: (post.comments || []).map((comment) => ({
        commentId: (comment._id as Types.ObjectId).toString(), // ✅ Use _id
        userId: comment.userId,
        userName: comment.userName,
        comment: comment.comment,
        likeCount: comment.likeCount || 0,
        likeUserIds: comment.likeUserIds || [],
        isLiked: userId ? comment.likeUserIds.includes(userId) : false,
        createdAt: comment.createdAt,
        subComments: (comment.subComments || []).map((subComment) => ({
          commentId: (subComment._id as Types.ObjectId).toString(), // ✅ Use _id
          userId: subComment.userId,
          userName: subComment.userName,
          comment: subComment.comment,
          likeCount: subComment.likeCount || 0,
          likeUserIds: subComment.likeUserIds || [],
          isLiked: userId ? subComment.likeUserIds.includes(userId) : false,
          createdAt: subComment.createdAt,
        })),
      })),
      fanbaseId: post.fanbaseId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isDeleted: post.isDeleted || false,
    };
  }
}
