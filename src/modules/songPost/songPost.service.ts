import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SongPost, SongPostDocument } from './songPost.model';
import { CreatePostDto, UpdatePostDto, AddCommentDto } from './dto/create-post.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class SongPostService {
  constructor(
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
    private readonly userService: UserService,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<SongPostDocument> {
    console.log('Creating new song post:', createPostDto);

    // Fetch username from UserService (for future use, but not stored in SongPost)
    // const username = await this.userService.getUsernameById(createPostDto.userId);
    // if (!username) {
    //   throw new Error('User not found for given userId');
    // }

    // Only use properties defined in the schema
    const createdPost = new this.songPostModel({
      ...createPostDto,
    });
    const savedPost = await createdPost.save();

    console.log('Song post created successfully:', savedPost);
    return savedPost;
  }

  async findAll(): Promise<SongPostDocument[]> {
    return this.songPostModel.find({ isHidden: { $ne: 1 } }).sort({ createdAt: -1 }).exec();
  }

  async findAllWithUsernames(): Promise<any[]> {
    const posts = await this.songPostModel
      .find({ isHidden: { $ne: 1 } })
      .sort({ createdAt: -1 })
      .lean();
    // Assuming you have access to userService
    return Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        return {
          ...post,
          username: username || '', // fallback if not found
          comments: await Promise.all(
            (post.comments || []).map(async (comment) => ({
              ...comment,
              username:
                (await this.userService.getUsernameById(comment.userId)) || '',
            })),
          ),
        };
      }),
    );
  }

  async findById(id: string): Promise<SongPostDocument | null> {
    return this.songPostModel.findOne({ _id: id, isHidden: { $ne: 1 } }).exec();
  }

  async findByUserId(userId: string): Promise<SongPostDocument[]> {
    return this.songPostModel.find({ userId, isHidden: { $ne: 1 } }).sort({ createdAt: -1 }).exec();
  }

  async likePost(
    postId: string,
    userId: string,
  ): Promise<SongPostDocument | null> {
    const post = await this.songPostModel.findById(postId);
    if (!post) return null;

    // Toggle like
    const index = post.likedBy.indexOf(userId);
    if (index === -1) {
      post.likedBy.push(userId);
    } else {
      post.likedBy.splice(index, 1);
    }
    post.likes = post.likedBy.length;
    await post.save();
    return post;
  }

  async addComment(
    postId: string,
    addCommentDto: AddCommentDto,
  ): Promise<SongPostDocument | null> {
    const post = await this.songPostModel.findById(postId);
    if (!post) return null;
    // Fetch username from UserService (for future use, but not stored in comment)
    const username = await this.userService.getUsernameById(
      addCommentDto.userId,
    );
    if (!username) {
      throw new Error('User not found for given userId');
    }

    post.comments.push({
      ...addCommentDto,
      username,
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
    });
    await post.save();
    return post;
  }

  async likeComment(
    postId: string,
    commentId: string,
    userId: string,
  ): Promise<SongPostDocument | null> {
    const post = await this.songPostModel.findById(postId);
    if (!post) return null;
    const comment = post.comments.find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) return null;

    const index = comment.likedBy.indexOf(userId);
    if (index === -1) {
      comment.likedBy.push(userId);
    } else {
      comment.likedBy.splice(index, 1);
    }
    comment.likes = comment.likedBy.length;
    await post.save();
    return post;
  }

  async getPostsByUserIds(userIds: string[]): Promise<any[]> {
    // Find posts where userId is in the userIds array and not hidden
    const posts = await this.songPostModel
      .find({ userId: { $in: userIds }, isHidden: { $ne: 1 } })
      .sort({ createdAt: -1 })
      .lean();
    // Attach username for each post
    const postsWithUsernames = await Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        return {
          ...post,
          username: username || '',
        };
      }),
    );
    //console.log('Follower posts with usernames:', postsWithUsernames);
    return postsWithUsernames;
  }

  async countPostsByUser(userId: string): Promise<number> {
    return this.songPostModel.countDocuments({ userId, isHidden: { $ne: 1 } }).exec();
  }

  async getPostDetails(postId: string): Promise<any> {
    const post = await this.songPostModel.findOne({ _id: postId, isHidden: { $ne: 1 } }).lean();
    if (!post) {
      return null;
    }

    const userIds = [post.userId, ...post.likedBy];
    const usernameMap = await this.userService.getUsernamesByIds(userIds);

    const likedByUsernames = post.likedBy
      .map((userId) => usernameMap.get(userId))
      .filter(Boolean);

    return {
      ...post,
      username: usernameMap.get(post.userId) || '',
      likedBy: likedByUsernames,
      albumImage: post.albumImage,
    };
  }

  async getLikeNotificationsForUser(userId: string): Promise<any[]> {
    // 1. Find all posts by the user that have at least one like and are not hidden
    const userPosts = await this.songPostModel
      .find({ userId, 'likedBy.0': { $exists: true }, isHidden: { $ne: 1 } })
      .sort({ updatedAt: -1 })
      .lean();

    // 2. If no posts with likes, return empty
    if (!userPosts.length) {
      return [];
    }

    // 3. Collect all unique user IDs from the 'likedBy' arrays
    const likerIds = [...new Set(userPosts.flatMap((post) => post.likedBy))];
    if (likerIds.length === 0) {
      return [];
    }

    // 4. Get all usernames in a single query
    const usernameMap = await this.userService.getUsernamesByIds(likerIds);

    // 5. Construct the notification objects
    const notifications = userPosts.map((post) => {
      const likedByUsernames = post.likedBy
        .map((id) => usernameMap.get(id))
        .filter((name): name is string => !!name);

      return {
        type: 'like',
        postId: post._id,
        albumImage: post.albumImage,
        songName: post.songName,
        actors: likedByUsernames,
        date: post.updatedAt,
      };
    });

    return notifications;
  }

  async getCommentNotificationsForUser(userId: string): Promise<any[]> {
    // 1. Find all posts by the user that are not hidden.
    const userPosts = await this.songPostModel
      .find({ userId, isHidden: { $ne: 1 } })
      .sort({ updatedAt: -1 })
      .lean();

    if (!userPosts.length) {
      return [];
    }

    // 2. Collect all comment notifications from these posts.
    const notifications: any[] = [];
    for (const post of userPosts) {
      if (post.comments && post.comments.length > 0) {
        for (const comment of post.comments) {
          // We only want to notify about comments from other users.
          if (comment.userId !== userId) {
            notifications.push({
              type: 'comment',
              postId: post._id,
              albumImage: post.albumImage,
              songName: post.songName,
              actors: [comment.username], // Keep it as an array for consistency
              message: comment.text, // The comment text
              date: comment.createdAt,
            });
          }
        }
      }
    }
    return notifications;
  }

  async getNotificationsForUser(userId: string): Promise<any[]> {
    const [likeNotifications, commentNotifications] = await Promise.all([
      this.getLikeNotificationsForUser(userId),
      this.getCommentNotificationsForUser(userId),
    ]);

    const allNotifications = [...likeNotifications, ...commentNotifications];

    // Sort by date, newest first
    allNotifications.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return allNotifications;
  }

  async updateSongPost(postId: string, updateData: UpdatePostDto): Promise<SongPostDocument | null> {
    console.log(`[DEBUG] Updating post with ID: ${postId}`);
    console.log(`[DEBUG] Update data:`, updateData);
    
    const post = await this.songPostModel.findByIdAndUpdate(
      postId, 
      updateData, 
      { new: true }
    ).exec();
    
    if (post) {
      console.log(`[DEBUG] Post updated successfully:`, post);
    } else {
      console.log(`[DEBUG] Post not found with ID: ${postId}`);
    }
    
    return post;
  }

  async hidePost(postId: string): Promise<SongPostDocument | null> {
    console.log(`[DEBUG] Hiding post with ID: ${postId}`);
    
    const post = await this.songPostModel.findByIdAndUpdate(
      postId, 
      { isHidden: 1 }, 
      { new: true }
    ).exec();
    
    if (post) {
      console.log(`[DEBUG] Post hidden successfully. isHidden: ${post.isHidden}`);
    } else {
      console.log(`[DEBUG] Post not found with ID: ${postId}`);
    }
    
    return post;
  }

  async deleteSongPost(postId: string): Promise<SongPostDocument | null> {
    return this.songPostModel.findByIdAndDelete(postId).exec();
  }
}
