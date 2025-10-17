import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './profile.model';
import { ProfileDto } from './dto/profile.dto';
import { SongPost, SongPostDocument } from '../songPost/songPost.model';
import { User, UserDocument } from '../user/user.model'; // <-- fix import
import { Post, PostDocument } from '../posts/post.model'; // <-- add import

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>, // <-- inject User model
    @InjectModel(Post.name) private postModel: Model<PostDocument>, // <-- inject Post model
  ) {}

  async getProfileByUserId(userId: string): Promise<ProfileDto | null> {
    // Find the user first to ensure the user exists and get the username
    const user = await this.userModel.findById(userId).lean();
    if (!user || !user.username) return null;

    const email = await this.userModel.findById(userId).select('email').lean();
    if (!email) return null;
    // Then find the profile
    const profile = await this.profileModel.findOne({ userId }).lean();
    if (!profile) return null;

    return {
      _id: profile._id,
      userId: profile.userId,
      username: user.username,
      userType: profile.userType ?? 'public',
      email: user.email ?? '',
      fullName: profile.fullName ?? '',
      profileImage: profile.profileImage ?? '',
      bio: profile.bio ?? '',
      posts: profile.posts,
      followers: profile.followers,
      following: profile.following,
      albumArts: profile.albumArts,
      savedPosts: profile.savedPosts ?? [], // Add this
      savedThoughtsPosts: profile.savedThoughtsPosts ?? [], // Add this
    };
  }

  async getPostsByUserId(userId: string) {
    return this.songPostModel
      .find({ userId, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateProfileByUserId(userId: string, updateData: any) {
    const allowedProfileFields = [
      'bio',
      'profileImage',
      'fullName',
      'userType',
    ]; // Added userType to allowed fields
    const profileUpdate: any = {};

    for (const field of allowedProfileFields) {
      if (updateData[field] !== undefined) {
        profileUpdate[field] = updateData[field];
      }
    }
    profileUpdate.updatedAt = new Date();

    // Update username and email in User collection
    const userUpdate: any = {};
    if (updateData.username !== undefined)
      userUpdate.username = updateData.username;
    if (updateData.email !== undefined) userUpdate.email = updateData.email;
    if (updateData.userType !== undefined)
      // Added userType update to User model
      userUpdate.userType = updateData.userType;

    if (Object.keys(userUpdate).length > 0) {
      await this.userModel.updateOne({ _id: userId }, { $set: userUpdate });
    }

    const updatedProfile = await this.profileModel
      .findOneAndUpdate({ userId }, { $set: profileUpdate }, { new: true })
      .lean();

    if (!updatedProfile) {
      return { success: false, message: 'Profile not found' };
    }

    const user = await this.userModel.findById(userId).lean();

    return {
      success: true,
      message: 'Profile updated successfully',
      profile: {
        ...updatedProfile,
        email: user?.email ?? '',
        username: user?.username ?? '',
        fullName: updatedProfile.fullName ?? '',
      },
    };
  }

  async createProfile(createProfileDto: {
    userId: string;
    bio?: string;
    profileImage?: string;
    fullName?: string;
    userType?: string; // Add userType parameter
  }) {
    const { userId, bio, profileImage, fullName, userType } = createProfileDto;

    // Check if profile already exists
    const existingProfile = await this.profileModel.findOne({ userId }).lean();
    if (existingProfile) {
      return {
        success: false,
        message: 'Profile already exists for this user',
      };
    }

    // Optionally, check if user exists
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const profile = new this.profileModel({
      userId,
      fullName: fullName ?? '',
      bio: bio ?? '',
      profileImage: profileImage ?? '',
      userType: userType ?? 'public', // Added userType with default 'public'
      posts: 0,
      followers: [],
      following: [],
      albumArts: [],
    });

    await profile.save();

    return { success: true, message: 'Profile created successfully', profile };
  }

  // COMMENTED OUT THIS FUNCTION... UNCOMMENT IF NEEDED
  async addFollowers(userId: string, followerId: string): Promise<void> {
    // Add followerId to userId's followers array
    await this.profileModel.updateOne(
      { userId },
      { $addToSet: { followers: followerId } },
    );
    // Add userId to followerId's following array
    await this.profileModel.updateOne(
      { userId: followerId },
      { $addToSet: { following: userId } },
    );
  }

  async getFollowers(userId: string): Promise<string[]> {
    const profile = await this.profileModel.findOne({ userId }).lean();
    return profile?.followers ?? [];
  }

  /**
   * Get total number of likes, comments, and all comments for each post by userId
   * Returns an array of objects: { postId, type, likes, commentsCount, comments }
   * type: 'SongPost' | 'Post'
   */
  async getPostStatsByUserId(userId: string) {
    // SongPost posts
    const songPosts = await this.songPostModel
      .find({ userId, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
      .sort({ createdAt: -1 })
      .lean();
    const songPostStats = songPosts.map((post) => ({
      postId: post._id?.toString(),
      type: 'SongPost',
      likes: post.likes || 0,
      commentsCount: post.comments ? post.comments.length : 0,
      comments: post.comments || [],
    }));

    // Post posts
    const posts = await this.postModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    // Note: Post model only has likesCount/commentsCount, not actual comments array
    const postStats = posts.map((post) => ({
      postId: post._id?.toString(),
      type: 'Post',
      likes: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      comments: [], // No comments array in Post model
    }));

    // Combine and return
    return [...songPostStats, ...postStats];
  }

  async countPostsByUser(userId: string): Promise<number> {
    return this.songPostModel
      .countDocuments({ userId, isHidden: { $ne: 1 }, isDeleted: { $ne: 1 } })
      .exec();
  }

  async getFollowersListWithDetails(userId: string) {
    // Get followers' userIds
    const profile = await this.profileModel.findOne({ userId }).lean();
    if (!profile) return [];
    const followerIds = profile.followers;

    // Fetch user details for each follower
    const users = await this.userModel
      .find({ _id: { $in: followerIds } })
      .select('_id username')
      .lean();

    // Fetch profile images and fullName for each follower
    const profiles = await this.profileModel
      .find({ userId: { $in: followerIds } })
      .select('userId profileImage fullName')
      .lean();

    // Map userId to profileImage and fullName
    const profileMap = new Map(
      profiles.map((p) => [
        p.userId,
        { profileImage: p.profileImage ?? '', fullName: p.fullName ?? '' },
      ]),
    );

    // Combine user info and profile image/fullName
    return users.map((u) => ({
      userId: u._id,
      username: u.username,
      profileImage: profileMap.get(String(u._id))?.profileImage ?? '',
      fullName: profileMap.get(String(u._id))?.fullName ?? '',
    }));
  }

  async getFollowingListWithDetails(userId: string) {
    // Get following userIds
    const profile = await this.profileModel.findOne({ userId }).lean();
    if (!profile) return [];
    const followingIds = profile.following;

    // Fetch user details for each following
    const users = await this.userModel
      .find({ _id: { $in: followingIds } })
      .select('_id username')
      .lean();

    // Fetch profile images and fullName for each following
    const profiles = await this.profileModel
      .find({ userId: { $in: followingIds } })
      .select('userId profileImage fullName')
      .lean();

    // Map userId to profileImage and fullName
    const profileMap = new Map(
      profiles.map((p) => [
        p.userId,
        { profileImage: p.profileImage ?? '', fullName: p.fullName ?? '' },
      ]),
    );

    // Combine user info and profile image/fullName
    return users.map((u) => ({
      userId: u._id,
      username: u.username,
      profileImage: profileMap.get(String(u._id))?.profileImage ?? '',
      fullName: profileMap.get(String(u._id))?.fullName ?? '',
    }));
  }

  // Save a post for a user
  async savePost(userId: string, postId: string): Promise<boolean> {
    try {
      const result = await this.profileModel.updateOne(
        { userId },
        { $addToSet: { savedPosts: postId } },
      );
      return result.modifiedCount > 0 || result.matchedCount > 0;
    } catch (error) {
      console.error('Error saving post:', error);
      return false;
    }
  }

  // Unsave a post for a user
  async unsavePost(userId: string, postId: string): Promise<boolean> {
    try {
      const result = await this.profileModel.updateOne(
        { userId },
        { $pull: { savedPosts: postId } },
      );
      return result.modifiedCount > 0 || result.matchedCount > 0;
    } catch (error) {
      console.error('Error unsaving post:', error);
      return false;
    }
  }

  // Check if a post is saved by a user
  async isPostSaved(userId: string, postId: string): Promise<boolean> {
    try {
      const profile = await this.profileModel
        .findOne({
          userId,
          savedPosts: postId,
        })
        .lean();
      return profile !== null;
    } catch (error) {
      console.error('Error checking if post is saved:', error);
      return false;
    }
  }

  // Get all saved post IDs for a user
  async getSavedPosts(userId: string): Promise<string[]> {
    try {
      const profile = await this.profileModel.findOne({ userId }).lean();
      return profile?.savedPosts || [];
    } catch (error) {
      console.error('Error getting saved posts:', error);
      return [];
    }
  }

  async followUser(followerId: string, followingId: string) {
    try {
      // Prevent following yourself
      if (followerId === followingId) {
        return {
          success: false,
          message: 'You cannot follow yourself',
        };
      }

      // Check if already following
      const followerProfile = await this.profileModel.findOne({
        userId: followerId,
      });
      if (followerProfile?.following?.includes(followingId)) {
        return {
          success: false,
          message: 'You are already following this user',
        };
      }

      // Use the existing addFollowers method
      await this.addFollowers(followingId, followerId);

      return {
        success: true,
        message: 'User followed successfully',
      };
    } catch (error) {
      console.error('Error following user:', error);
      return {
        success: false,
        message: 'Failed to follow user',
      };
    }
  }

  async unfollowUser(followerId: string, followingId: string) {
    try {
      // Remove from followers array of the following user
      await this.profileModel.updateOne(
        { userId: followingId },
        { $pull: { followers: followerId } },
      );

      // Remove from following array of the follower user
      await this.profileModel.updateOne(
        { userId: followerId },
        { $pull: { following: followingId } },
      );

      return {
        success: true,
        message: 'User unfollowed successfully',
      };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return {
        success: false,
        message: 'Failed to unfollow user',
      };
    }
  }

  // Save a thoughts post for a user
  async saveThoughtsPost(userId: string, postId: string): Promise<boolean> {
    try {
      const result = await this.profileModel.updateOne(
        { userId },
        { $addToSet: { savedThoughtsPosts: postId } },
      );
      return result.modifiedCount > 0 || result.matchedCount > 0;
    } catch (error) {
      console.error('Error saving thoughts post:', error);
      return false;
    }
  }

  // Unsave a thoughts post for a user
  async unsaveThoughtsPost(userId: string, postId: string): Promise<boolean> {
    try {
      const result = await this.profileModel.updateOne(
        { userId },
        { $pull: { savedThoughtsPosts: postId } },
      );
      return result.modifiedCount > 0 || result.matchedCount > 0;
    } catch (error) {
      console.error('Error unsaving thoughts post:', error);
      return false;
    }
  }

  // Check if a thoughts post is saved by a user
  async isThoughtsPostSaved(userId: string, postId: string): Promise<boolean> {
    try {
      const profile = await this.profileModel.findOne({ userId }).lean();
      return profile?.savedThoughtsPosts?.includes(postId) || false;
    } catch (error) {
      console.error('Error checking if thoughts post is saved:', error);
      return false;
    }
  }

  // Get all saved thoughts posts for a user
  async getSavedThoughtsPosts(userId: string): Promise<string[]> {
    try {
      const profile = await this.profileModel.findOne({ userId }).lean();
      return profile?.savedThoughtsPosts || [];
    } catch (error) {
      console.error('Error getting saved thoughts posts:', error);
      return [];
    }
  }
}
