import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SongPost, SongPostDocument } from './songPost.model';
import {
  CreatePostDto,
  UpdatePostDto,
  AddCommentDto,
} from './dto/create-post.dto';
import { UserService } from '../user/user.service';
import { ProfileService } from '../profile/profile.service';
import { SpotifySessionService } from '../spotify/services/spotify.session-service'
import { SpotifyUserService } from '../spotify/services/spotify.user-service'
import { ColorExtractor } from './utils/color-extractor';

@Injectable()
export class SongPostService {
  constructor(
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly spotifySessionService: SpotifySessionService,
    private readonly spotifyUserService: SpotifyUserService,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<SongPostDocument> {
    console.log('[DEBUG] Creating song post:', createPostDto);

    // Use frontend-provided backgroundColor if available, otherwise extract from album image
    let backgroundColor: string | undefined = createPostDto.backgroundColor;
    
    if (!backgroundColor && createPostDto.albumImage) {
      try {
        //console.log('[DEBUG] No frontend color provided, extracting color from album image:', createPostDto.albumImage);
        const extractedColor = await ColorExtractor.extractColor(createPostDto.albumImage);
        if (extractedColor) {
          backgroundColor = extractedColor.color;
          //console.log('[DEBUG] Extracted color:', backgroundColor);
        } else {
          backgroundColor = ColorExtractor.getDefaultColor();
          //console.log('[DEBUG] Using default color:', backgroundColor);
        }
      } catch (error) {
        console.error('[ERROR] Failed to extract color:', error);
        //backgroundColor = ColorExtractor.getDefaultColor();
      }
    } else if (!backgroundColor) {
      backgroundColor = ColorExtractor.getDefaultColor();
      console.log('[DEBUG] No album image, using default color:', backgroundColor);
    } else {
      console.log('[DEBUG] Using frontend-provided color:', backgroundColor);
    }
    
    const createdPost = new this.songPostModel({
      ...createPostDto,
      backgroundColor,
    });

    const savedPost = await createdPost.save();
    console.log('[DEBUG] Song post created successfully with color:', backgroundColor);
    return savedPost;
  }

  async findAll(): Promise<SongPostDocument[]> {
    return this.songPostModel
      .find({ isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllWithUsernames(): Promise<any[]> {
    const posts = await this.songPostModel
      .find({ isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
      .sort({ createdAt: -1 })
      .lean();
    // Assuming you have access to userService
    return Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        const profile = await this.profileService.getProfileByUserId(
          post.userId,
        );
        const profileImage = profile?.profileImage || '';
        return {
          ...post,
          username: username || '',
          userImage: profileImage,
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
    return this.songPostModel
      .findOne({ _id: id, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
      .exec();
  }

  async findByUserId(userId: string): Promise<SongPostDocument[]> {
    return this.songPostModel
      .find({ userId, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async likePost(
    postId: string,
    userId: string,
  ): Promise<SongPostDocument | null> {
    const post = await this.songPostModel.findOne({
      _id: postId,
      isDeleted: { $ne: 1 },
    });
    if (!post) return null;

    // Check if user already liked the post
    const isLiked = post.likedBy.includes(userId);

    let updateOperation;
    if (isLiked) {
      updateOperation = {
        $pull: { likedBy: userId },
        $inc: { likes: -1 },
      };
    } else {
      updateOperation = {
        $addToSet: { likedBy: userId },
        $inc: { likes: 1 },
      };
    }

    // Use findOneAndUpdate for update happens in 1 database call
    const updatedPost = await this.songPostModel.findOneAndUpdate(
      { _id: postId, isDeleted: { $ne: 1 } },
      updateOperation,
      { new: true, runValidators: true },
    );

    return updatedPost;
  }

  async addComment(
    postId: string,
    addCommentDto: AddCommentDto,
  ): Promise<SongPostDocument | null> {
    const post = await this.songPostModel.findOne({
      _id: postId,
      isDeleted: { $ne: 1 },
    });
    if (!post) return null;
    // Fetch username from UserService (for future use, but not stored in comment)
    const username = await this.userService.getUsernameById(
      addCommentDto.userId,
    );
    if (!username) {
      throw new Error('User not found for given userId');
    }

    // Use atomic operation to add comment
    const updatedPost = await this.songPostModel.findOneAndUpdate(
      { _id: postId, isDeleted: { $ne: 1 } },
      {
        $push: {
          comments: {
            ...addCommentDto,
            username,
            createdAt: new Date(),
            likes: 0,
            likedBy: [],
          },
        },
      },
      { new: true, runValidators: true },
    );

    return updatedPost;
  }

  async likeComment(
    postId: string,
    commentId: string,
    userId: string,
  ): Promise<SongPostDocument | null> {
    const post = await this.songPostModel.findOne({
      _id: postId,
      isDeleted: { $ne: 1 },
    });
    if (!post) return null;
    const comment = post.comments.find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) {
      console.log(
        `[DEBUG] Backend likeComment: Comment not found with ID ${commentId}`,
      );
      return null;
    }

    // Check if user already liked the comment
    const isLiked = comment.likedBy.includes(userId);

    let updateOperation;
    if (isLiked) {
      // Remove like from comment
      updateOperation = {
        $pull: { 'comments.$[comment].likedBy': userId },
        $inc: { 'comments.$[comment].likes': -1 },
      };
    } else {
      // Add like to comment
      updateOperation = {
        $addToSet: { 'comments.$[comment].likedBy': userId },
        $inc: { 'comments.$[comment].likes': 1 },
      };
    }

    // Use findOneAndUpdate for atomic operation
    const updatedPost = await this.songPostModel.findOneAndUpdate(
      { _id: postId, isDeleted: { $ne: 1 } },
      updateOperation,
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ 'comment._id': { $eq: commentId } }],
      },
    );

    return updatedPost;
  }

  async getPostsByUserIds(userIds: string[]): Promise<any[]> {
    // Find posts where userId is in the userIds array and not hidden and not deleted
    const posts = await this.songPostModel
      .find({
        userId: { $in: userIds },
        isHidden: { $ne: 1 },
        isDeleted: { $ne: 1 },
      })
      .sort({ createdAt: -1 })
      .lean();
    // Attach username and profile image for each post
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        const profile = await this.profileService.getProfileByUserId(
          post.userId,
        );
        const profileImage = profile?.profileImage || '';
        return {
          ...post,
          username: username || '',
          userImage: profileImage,
        };
      }),
    );
    //console.log('Follower posts with usernames and profile images:', postsWithUserData);
    return postsWithUserData;
  }

  // async getPostsByIds(postIds: string[]): Promise<any[]> {
  //   if (!postIds || postIds.length === 0) return [];
  //   const posts = await this.songPostModel
  //     .find({ _id: { $in: postIds }, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
  //     .lean();
  //   const postsWithUserData = await Promise.all(
  //     posts.map(async (post) => {
  //       const username = await this.userService.getUsernameById(post.userId);
  //       const profile = await this.profileService.getProfileByUserId(post.userId);
  //       const profileImage = profile?.profileImage || '';
  //       return { ...post, username: username || '', userImage: profileImage };
  //     }),
  //   );
  //   return postsWithUserData;
  // }

  async getSpotifyUserTopTracks(userId: string): Promise<any> {
    const spotifyToken = await this.spotifySessionService.getAccessToken(userId);
    if (!spotifyToken) {
      return { tracks: [] };
    }
    const topTracks = await this.spotifyUserService.getUsersTopTracks(spotifyToken);
    return topTracks;
  }

  async getRecentPostsByUserIds(userIds: string[], perUserLimit: number): Promise<any[]> {
    if (!userIds || userIds.length === 0) return [];
    const sanitizedLimit = Math.max(1, Math.min(100, perUserLimit || 20));
    const posts = await this.songPostModel
      .aggregate([
        { $match: { userId: { $in: userIds }, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$userId',
            posts: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            posts: { $slice: ['$posts', sanitizedLimit] },
          },
        },
        { $unwind: '$posts' },
        { $replaceRoot: { newRoot: '$posts' } },
        { $sort: { createdAt: -1 } },
      ])
      .exec();

    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        const profile = await this.profileService.getProfileByUserId(post.userId);
        const profileImage = profile?.profileImage || '';
        return { ...post, username: username || '', userImage: profileImage };
      }),
    );
    return postsWithUserData;
  }

  async countPostsByUser(userId: string): Promise<number> {
    return this.songPostModel
      .countDocuments({ userId, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
      .exec();
  }

  async getPostDetails(postId: string): Promise<any> {
    const post = await this.songPostModel
      .findOne({ _id: postId, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
      .lean();
    if (!post) {
      return null;
    }

    const userIds = [post.userId, ...post.likedBy];
    const usernameMap = await this.userService.getUsernamesByIds(userIds);
    const profile = await this.profileService.getProfileByUserId(post.userId);
    const profileImage = profile?.profileImage || '';

    const likedByUsernames = post.likedBy
      .map((userId) => usernameMap.get(userId))
      .filter(Boolean);

    return {
      ...post,
      username: usernameMap.get(post.userId) || '',
      userImage: profileImage,
      likedBy: likedByUsernames,
      albumImage: post.albumImage,
    };
  }

  async getLikeNotificationsForUser(userId: string): Promise<any[]> {
    // 1. Find all posts by the user that have at least one like and are not hidden and not deleted
    const userPosts = await this.songPostModel
      .find({
        userId,
        'likedBy.0': { $exists: true },
        isHidden: { $ne: 1 },
        isDeleted: { $ne: 1 },
      })
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
    // 1. Find all posts by the user that are not hidden and not deleted.
    const userPosts = await this.songPostModel
      .find({ userId, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
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

  async updateSongPost(
    postId: string,
    updateData: UpdatePostDto,
  ): Promise<SongPostDocument | null> {
    console.log(`[DEBUG] Updating post with ID: ${postId}`);
    console.log(`[DEBUG] Update data:`, updateData);

    const post = await this.songPostModel
      .findOneAndUpdate({ _id: postId, isDeleted: { $ne: 1 } }, updateData, {
        new: true,
      })
      .exec();

    if (post) {
      console.log(`[DEBUG] Post updated successfully:`, post);
    } else {
      console.log(`[DEBUG] Post not found with ID: ${postId}`);
    }

    return post;
  }

  async hidePost(postId: string): Promise<SongPostDocument | null> {
    console.log(`[DEBUG] Hiding post with ID: ${postId}`);

    const post = await this.songPostModel
      .findOneAndUpdate(
        { _id: postId, isDeleted: { $ne: 1 } },
        { isHidden: 1 },
        { new: true },
      )
      .exec();

    if (post) {
      console.log(
        `[DEBUG] Post hidden successfully. isHidden: ${post.isHidden}`,
      );
    } else {
      console.log(`[DEBUG] Post not found with ID: ${postId}`);
    }

    return post;
  }

  // Find hidden posts for a specific user (isHidden == 1, isDeleted == 0)
  async findHiddenByUserId(userId: string): Promise<any[]> {
    const posts = await this.songPostModel
      .find({ userId, isHidden: 1, isDeleted: { $ne: 1 } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    // Optionally attach usernames for comments and post (reuse existing logic)
    const postsWithUsernames = await Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        return {
          ...post,
          username: username || '',
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
    return postsWithUsernames;
  }

  // Unhide a post (set isHidden = 0). Does not perform auth checks here;
  // controller or guards should enforce ownership if required.
  async unhidePost(postId: string): Promise<SongPostDocument | null> {
    const post = await this.songPostModel
      .findOneAndUpdate(
        { _id: postId, isDeleted: { $ne: 1 } },
        { isHidden: 0 },
        { new: true },
      )
      .exec();
    return post;
  }

  async deleteSongPost(postId: string): Promise<SongPostDocument | null> {
    console.log(`[DEBUG] Soft deleting post with ID: ${postId}`);

    const post = await this.songPostModel
      .findByIdAndUpdate(postId, { isDeleted: 1 }, { new: true })
      .exec();

    if (post) {
      console.log(
        `[DEBUG] Post soft deleted successfully. isDeleted: ${post.isDeleted}`,
      );
    } else {
      console.log(`[DEBUG] Post not found with ID: ${postId}`);
    }

    return post;
  }

  async getPostsByIds(ids: string[]): Promise<any[]> {
    try {
      const posts = await this.songPostModel
        .find({
          _id: { $in: ids },
          isHidden: { $ne: 1 },
          isDeleted: { $ne: 1 },
        })
        .lean();
      return Promise.all(
        posts.map(async (post) => {
          try {
            const username = await this.userService.getUsernameById(
              post.userId,
            );
            const profile = await this.profileService.getProfileByUserId(
              post.userId,
            );
            const profileImage = profile?.profileImage || '';
            return {
              ...post,
              username: username || '',
              userImage: profileImage,
              comments: await Promise.all(
                (post.comments || []).map(async (comment) => ({
                  ...comment,
                  username:
                    (await this.userService.getUsernameById(comment.userId)) ||
                    '',
                })),
              ),
            };
          } catch (error) {
            console.error(`Error populating post ${post._id}:`, error);
            // Return post with default values if population fails
            return {
              ...post,
              username: '',
              userImage: '',
              comments: (post.comments || []).map((comment) => ({
                ...comment,
                username: '',
              })),
            };
          }
        }),
      );
    } catch (error) {
      console.error('Error getting posts by ids:', error);
      return [];
    }
  }
}
