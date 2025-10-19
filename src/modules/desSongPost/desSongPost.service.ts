import { Injectable, NotFoundException, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DesSongPost, DesSongPostDocument } from './desSongPost.model';
import { CreateDesSongPostDto } from './dto/create-despost.dto';
import { AddDesCommentDto } from './dto/create-comment.dto';
import { AddPostToFanbaseDto } from './dto/add-to-fanbase.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { LikePostDto } from './dto/like-post.dto';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class DesSongPostService {
  constructor(
    @InjectModel(DesSongPost.name)
    private readonly desPostModel: Model<DesSongPostDocument>,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  async createPost(dto: CreateDesSongPostDto) {
    console.log('Incomming DesPost:', dto);
    const post = new this.desPostModel({
      ...dto,
    });
    console.log('DesPost created:', post);
    return await post.save();
  }

  async findAll(): Promise<DesSongPostDocument[]> {
    return this.desPostModel.find().sort({ createdAt: -1 }).exec();
  }

  async findAllWithUsernames(): Promise<any[]> {
    const posts = await this.desPostModel.find().sort({ createdAt: -1 }).lean();
    return Promise.all(
      posts.map(async post => {
        const username = await this.userService.getUsernameById(post.userId);
        return {
          ...post,
          username: username || '',
          comments: await Promise.all((post.comments || []).map(async comment => ({
            ...comment,
            username: await this.userService.getUsernameById(comment.userId) || '',
          }))),
        };
      }),
    );
  }

  async findById(id: string): Promise<DesSongPostDocument | null> {
    return this.desPostModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<DesSongPostDocument[]> {
    return this.desPostModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async addComment(dto: AddDesCommentDto) {
    const post = await this.desPostModel.findById(dto.postId);
    if (!post) throw new NotFoundException('Post not found');
    console.log(Post, 'Adding comment to post:', post.id);

    const comment = {
      id: new Types.ObjectId(),
      userId: dto.userId,
      text: dto.text,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      likedBy: [],
    };

    console.log('Comment to be added:', comment);
    post.comments.push(comment);
    await post.save();
    console.log('Comment added successfully:', comment);

    // Trigger notification if commenter is not the post owner
    if (post.userId.toString() !== dto.userId) {
      try {
        // Get commenter's username
        const commenter = await this.userService.findById(dto.userId);
        if (commenter) {
          await this.notificationService.createPostCommentNotification(
            post.userId.toString(),      // post owner (recipient)
            dto.userId,                  // commenter (sender)
            commenter.username,          // commenter username
            dto.postId,                  // post ID
            post.songName,               // song name
            post.artists,                // artist name
            dto.text                     // comment text
          );
          console.log(`✅ Comment notification sent to user ${post.userId} from ${commenter.username}`);
        }
      } catch (error) {
        console.error('❌ Failed to create comment notification:', error);
      }
    }

    return comment;
  }

  async likePost(dto: LikePostDto): Promise<DesSongPostDocument | null> {
    const post = await this.desPostModel.findById(dto.postId);
    if (!post) return null;

    const index = post.likedBy.indexOf(dto.userId);
    const wasLiked = index !== -1;
    const isLiking = index === -1;

    if (index === -1) {
      post.likedBy.push(dto.userId);
    } else {
      post.likedBy.splice(index, 1);
    }
    post.likes = post.likedBy.length;
    await post.save();

    // Trigger notification only when liking (not unliking) and liker is not the post owner
    if (isLiking && post.userId.toString() !== dto.userId) {
      try {
        // Get liker's username
        const liker = await this.userService.findById(dto.userId);
        if (liker) {
          await this.notificationService.createPostLikeNotification(
            post.userId.toString(),    // post owner (recipient)
            dto.userId,                // liker (sender)
            liker.username,            // liker username
            dto.postId,                // post ID
            post.songName,             // song name
            post.artists               // artist name
          );
          console.log(`✅ Like notification sent to user ${post.userId} from ${liker.username}`);
        }
      } catch (error) {
        console.error('❌ Failed to create like notification:', error);
      }
    }

    return post;
  }

  async unlikePost(dto: LikePostDto): Promise<DesSongPostDocument | null> {
    const post = await this.desPostModel.findById(dto.postId);
    if (!post) return null;

    const index = post.likedBy.indexOf(dto.userId);
    if (index !== -1) {
      post.likedBy.splice(index, 1);
      post.likes = post.likedBy.length;
      await post.save();
      return post;
    }
    return null;
  }

  async likeComment(dto: LikeCommentDto): Promise<DesSongPostDocument | null> {
    const post = await this.desPostModel.findById(dto.postId);
    if (!post) return null;

    const comment = post.comments.find((c: any) => c.id?.toString() === dto.commentId);
    if (!comment) return null;

    const index = comment.likedBy.indexOf(dto.userId);
    if (index === -1) {
      comment.likedBy.push(dto.userId);
    } else {
      comment.likedBy.splice(index, 1);
    }
    comment.likes = comment.likedBy.length;
    await post.save();
    return post;
  }

  async unlikeComment(dto: LikeCommentDto): Promise<DesSongPostDocument | null> {
    const post = await this.desPostModel.findById(dto.postId);
    if (!post) return null;

    const comment = post.comments.find((c: any) => c.id?.toString() === dto.commentId);
    if (!comment) return null;

    const index = comment.likedBy.indexOf(dto.userId);
    if (index !== -1) {
      comment.likedBy.splice(index, 1);
      comment.likes = comment.likedBy.length;
      await post.save();
      return post;
    }
    return null;
  }

  async getPostsByUserIds(userIds: string[]): Promise<any[]> {
    const posts = await this.desPostModel.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean();
    return Promise.all(posts.map(async post => {
      const username = await this.userService.getUsernameById(post.userId);
      return {
        ...post,
        username: username || '',
      };
    }));
  }

  async getPostsByFanbaseId(fanbaseId: string): Promise<DesSongPostDocument[]> {
    return this.desPostModel.find({ FanbaseID: fanbaseId }).sort({ createdAt: -1 }).exec();
  }

  async getPostsBySongId(songId: string): Promise<DesSongPostDocument[]> {
    return this.desPostModel.find({ songId }).sort({ createdAt: -1 }).exec();
  }

  async addPostToFanbase(dto: AddPostToFanbaseDto): Promise<DesSongPostDocument | null> {
    const user = await this.userService.findById(dto.userId);
    if (!user) return null;
    const post = await this.desPostModel.findById(dto.postId);
    if (!post) return null;

    post.inAFanbase = true;
    post.FanbaseID = dto.fanbaseId;
    await post.save();
    return post;
  }

  async createPostWithFanbase(dto: CreateDesSongPostDto, fanbaseId: string): Promise<DesSongPostDocument> {
    const post = new this.desPostModel({
      ...dto,
      likes: 0,
      likedBy: [],
      inAFanbase: true,
      FanbaseID: fanbaseId,
    });
    return await post.save();
  }
}
