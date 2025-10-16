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
    // Find posts where userId is in the userIds array and not hidden and not deleted
    const posts = await this.thoughtsModel
      .find({ 
        userId: { $in: userIds }, 
        isHidden: { $ne: 1 }, 
        isDeleted: { $ne: 1 } 
      })
      .sort({ createdAt: -1 })
      .lean();
    
    // Attach username and profile image for each post
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        const profile = await this.profileService.getProfileByUserId(post.userId);
        const profileImage = profile?.profileImage || '';
        return {
          ...post,
          username: username || '',
          userImage: profileImage,
          postType: 'thoughts',
        };
      }),
    );
    
    return postsWithUserData;
  }

  // Get thoughts post by ID (for individual post viewing)
  async findById(id: string): Promise<any> {
    const post = await this.thoughtsModel.findOne({ 
      _id: id, 
      isHidden: { $ne: 1 }, 
      isDeleted: { $ne: 1 } 
    }).lean();
    if (!post) return null;
    
    const username = await this.userService.getUsernameById(post.userId);
    const profile = await this.profileService.getProfileByUserId(post.userId);
    const profileImage = profile?.profileImage || '';
    
    // Ensure comments have usernames - optimized with batch lookup
    const userIds = [...new Set(post.comments.map(c => c.userId))]; // Get unique user IDs
    const usernamesMap = await this.userService.getUsernamesByIds(userIds);
    
    const commentsWithUsernames = post.comments.map((comment) => {
      return {
        ...comment,
        username: usernamesMap.get(comment.userId) || comment.username || 'Unknown',
      };
    });
    
    return {
      ...post,
      username: username || '',
      userImage: profileImage,
      postType: 'thoughts',
      comments: commentsWithUsernames,
    };
  }

  // Get thoughts posts by user ID (for user profile)
  async findByUserId(userId: string): Promise<any[]> {
    const posts = await this.thoughtsModel.find({ 
      userId, 
      isHidden: { $ne: 1 }, 
      isDeleted: { $ne: 1 } 
    }).sort({ createdAt: -1 }).lean();
    
    // Attach username and profile image for each post
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        const profile = await this.profileService.getProfileByUserId(post.userId);
        const profileImage = profile?.profileImage || '';
        return {
          ...post,
          username: username || '',
          userImage: profileImage,
          postType: 'thoughts',
        };
      }),
    );
    
    return postsWithUserData;
  }

  // Like a thoughts post
  async likePost(postId: string, userId: string): Promise<any> {
    const post = await this.thoughtsModel.findOne({ 
      _id: postId, 
      isHidden: { $ne: 1 }, 
      isDeleted: { $ne: 1 } 
    });
    if (!post) return null;

    const index = post.likedBy.indexOf(userId);
    if (index === -1) {
      post.likedBy.push(userId);
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
    console.log('[DEBUG] ThoughtsService.addComment: postId:', postId, 'dto:', dto);
    
    const post = await this.thoughtsModel.findOne({ 
      _id: postId, 
      isHidden: { $ne: 1 }, 
      isDeleted: { $ne: 1 } 
    });
    if (!post) {
      console.log('[DEBUG] ThoughtsService.addComment: Post not found for ID:', postId);
      throw new NotFoundException('Thoughts post not found');
    }
    
    console.log('[DEBUG] ThoughtsService.addComment: Found post:', post._id);

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
    
    // Get usernames for all comments in parallel for better performance
    const userIds = [...new Set(post.comments.map(c => c.userId))]; // Get unique user IDs
    const usernamesMap = await this.userService.getUsernamesByIds(userIds);
    
    const commentsWithUsernames = post.comments.map((comment) => {
      return {
        ...comment.toObject(),
        username: usernamesMap.get(comment.userId) || comment.username || 'Unknown',
      };
    });
    
    // Return the updated post with username and postType
    const username_post = await this.userService.getUsernameById(post.userId);
    return {
      ...post.toObject(),
      username: username_post || '',
      postType: 'thoughts',
      comments: commentsWithUsernames,
    };
  }

  // Like/unlike a thoughts comment
  async likeComment(postId: string, commentId: string, userId: string): Promise<any> {
    const post = await this.thoughtsModel.findOne({ 
      _id: postId, 
      isHidden: { $ne: 1 }, 
      isDeleted: { $ne: 1 } 
    });
    if (!post) return null;

    const comment = post.comments.find(c => c.id.toString() === commentId);
    if (!comment) return null;

    const index = comment.likedBy.indexOf(userId);
    if (index === -1) {
      comment.likedBy.push(userId);
    } else {
      comment.likedBy.splice(index, 1);
    }
    comment.likes = comment.likedBy.length;
    comment.updatedAt = new Date();
    
    await post.save();
    console.log('Comment like updated:', comment);
    
    // Get usernames for all comments - optimized with batch lookup
    const userIds = [...new Set(post.comments.map(c => c.userId))]; // Get unique user IDs
    const usernamesMap = await this.userService.getUsernamesByIds(userIds);
    
    const commentsWithUsernames = post.comments.map((comment) => {
      return {
        ...comment.toObject(),
        username: usernamesMap.get(comment.userId) || comment.username || 'Unknown',
      };
    });
    
    // Return the updated post with username and postType
    const username = await this.userService.getUsernameById(post.userId);
    return {
      ...post.toObject(),
      username: username || '',
      postType: 'thoughts',
      comments: commentsWithUsernames,
    };
  }

  // Delete thoughts post (soft delete)
  async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await this.thoughtsModel.findOne({ 
      _id: postId, 
      isDeleted: { $ne: 1 } 
    });
    if (!post || post.userId !== userId) return false;

    // Soft delete by setting isDeleted to 1
    await this.thoughtsModel.findByIdAndUpdate(postId, { isDeleted: 1 });
    return true;
  }

  // Hide thoughts post
  async hidePost(postId: string): Promise<any> {
    console.log(`[DEBUG] Hiding thoughts post with ID: ${postId}`);
    
    const post = await this.thoughtsModel.findOneAndUpdate(
      { _id: postId, isDeleted: { $ne: 1 } },
      { isHidden: 1 }, 
      { new: true }
    ).exec();
    
    if (post) {
      console.log(`[DEBUG] Thoughts post hidden successfully. isHidden: ${post.isHidden}`);
    } else {
      console.log(`[DEBUG] Thoughts post not found with ID: ${postId}`);
    }
    
    return post;
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
