import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  Patch,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SongPostService } from './songPost.service';
import { RecentlyLikedUserService } from '../interaction/interaction.service';
import {
  CreatePostDto,
  UpdatePostDto,
  AddCommentDto,
} from './dto/create-post.dto';
import { SongPost, SongPostDocument } from './songPost.model';
import { ProfileService } from '../profile/profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  JwtUser,
  JwtUserData,
} from '../../common/decorators/jwt-user.decorator';

import { Delete } from '@nestjs/common';

@Controller('song-posts')
export class SongPostController {
  constructor(
    private readonly songPostService: SongPostService,
    private readonly profileService: ProfileService,
    private readonly recentlyLikedUserService: RecentlyLikedUserService,
  ) {}

  @Patch(':id/hide')
  async hidePost(@Param('id') id: string) {
    const post = await this.songPostService.hidePost(id);
    if (!post) return { success: false, message: 'Post not found' };
    return { success: true, data: post };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createPostDto: CreatePostDto,
    @JwtUser() user: JwtUserData,
  ): Promise<SongPostDocument> {
    //console.log('Received create post request:', createPostDto);
    //console.log('User from JWT:', user);

    // set userId from JWT token to the DTO
    createPostDto.userId = user.userId;

   
    const createdPost = await this.songPostService.create(createPostDto);

    return createdPost;
  }

  @Post('by-ids')
  async getPostsByIds(@Body() body: { ids: string[] }) {
    const posts = await this.songPostService.getPostsByIds(body.ids);
    return { posts };
  }

  @Get()
  async findAll(): Promise<any[]> {
    return this.songPostService.findAllWithUsernames();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<SongPostDocument | null> {
    return this.songPostService.findById(id);
  }

  @Get(':id/details')
  async getPostDetails(@Param('id') id: string) {
    const details = await this.songPostService.getPostDetails(id);
    if (!details) {
      return { success: false, message: 'Post not found' };
    }
    return { success: true, data: details };
  }

  @Get('user/:userId')
  async findByUserId(
    @Param('userId') userId: string,
  ): Promise<SongPostDocument[]> {
    return this.songPostService.findByUserId(userId);
  }

  // Return only hidden posts for the specified user
  @Get('user/:userId/hidden')
  async findHiddenByUserId(@Param('userId') userId: string) {
    const posts = await this.songPostService.findHiddenByUserId(userId);
    return { success: true, data: posts };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(@Param('id') postId: string, @JwtUser() user: JwtUserData) {
    const post = await this.songPostService.likePost(postId, user.userId);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }
    return { success: true, data: post };
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') postId: string,
    @Body() addCommentDto: AddCommentDto,
    @JwtUser() user: JwtUserData,
  ) {
    // Set userId from JWT token
    addCommentDto.userId = user.userId;
    // username will be fetched in the service, not from DTO
    const post = await this.songPostService.addComment(postId, addCommentDto);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }
    return { success: true, data: post };
  }

  @Post(':postId/comment/:commentId/like')
  @UseGuards(JwtAuthGuard)
  async likeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @JwtUser() user: JwtUserData,
  ) {
    console.log(
      `[DEBUG] Controller likeComment: postId=${postId}, commentId=${commentId}, userId=${user.userId}`,
    );

    const post = await this.songPostService.likeComment(
      postId,
      commentId,
      user.userId,
    );
    if (!post) {
      console.log('[DEBUG] Controller likeComment: Post or comment not found');
      return { success: false, message: 'Post or comment not found' };
    }
    console.log('[DEBUG] Controller likeComment: Success');
    return { success: true, data: post };
  }

  @Delete(':postId/comment/:commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @JwtUser() user: JwtUserData,
  ) {
    const result = await this.songPostService.deleteComment(
      postId,
      commentId,
      user.userId,
    );
    if (!result.success) {
      return { success: false, message: result.message };
    }
    return { success: true, data: result.post };
  }

  @Get('followers/:userId')
  async getUserFeedPosts(@Param('userId') userId: string) {
    console.log('Get User Feed Posts called');
    // Feed Algorithm here
    // 1. Get followers
    const followings = await this.profileService.getFollowing(userId);
    if (!followings || followings.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Sample up to 10 followers (random if more than 10)
    let sampledFollowings: string[] = followings;
    if (followings.length > 10) {
      const shuffled = [...followings].sort(() => Math.random() - 0.5);
      sampledFollowings = shuffled.slice(0, 10);
    }

    // 3. Get recent posts by followers with per-user upper bound (20)
    const recentFollowerPosts = await this.songPostService.getRecentPostsByUserIds(followings, 20);

    // 4. For each sampled follower, fetch their recently liked post IDs
    const likedPostIdsNested = await Promise.all(
      sampledFollowings.map((fid) => this.recentlyLikedUserService.getRecentlyLikedUsers(fid)),
    );
    const likedPostIds = Array.from(new Set(likedPostIdsNested.flat())) as string[];

    // 5. Fetch details for liked post IDs
    const likedPosts = await this.songPostService.getPostsByIds(likedPostIds);

    // 6. Fetch posts from users top tracks (5 tracks, 1 post per track)
    let topTrackPosts: any[] = [];
    try {
      const startTime = Date.now();
      
      // Add a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Spotify top tracks request timeout after 10s')), 10000);
      });
      
      const spotifyPromise = this.songPostService.getSpotifyUserTopTrackPosts(userId, 5, 2);
      
      topTrackPosts = await Promise.race([spotifyPromise, timeoutPromise]) as any[];
      
      const endTime = Date.now();
      // console.log(`[DEBUG] getSpotifyUserTopTrackPosts completed in ${endTime - startTime}ms, returned ${topTrackPosts?.length || 0} posts`);
    } catch (error) {
      console.error('[ERROR] getSpotifyUserTopTrackPosts failed:', error.message);
      // console.error('[ERROR] Full error:', error)i;
      // Continue without Spotify top tracks - don't break the feed
      topTrackPosts = [];
    }

    // 7. Merge and de-duplicate by _id
    const merged = [...recentFollowerPosts, ...likedPosts, ...topTrackPosts];

    const seen = new Set<string>();
    const deduped = merged.filter((p: any) => {
      const id = (p._id || '').toString();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // 8. Phase 1: Calculate scores for each post
    const postsWithScores = deduped.map((post: any) => {
      // Determine post source for weighting
      let sourceWeight = 0.5; // default
      const postId = post._id.toString();
      
      if (recentFollowerPosts.some((p: any) => p._id.toString() === postId)) {
        sourceWeight = 1.0; // Follower posts (highest priority)
      } else if (likedPosts.some((p: any) => p._id.toString() === postId)) {
        sourceWeight = 0.8; // Liked posts by followers
      } else if (topTrackPosts.some((p: any) => p._id.toString() === postId)) {
        sourceWeight = 0.7; // Spotify-based posts
      }

      // Calculate post age in hours
      const postAgeMs = Date.now() - new Date(post.createdAt).getTime();
      const postAgeHours = postAgeMs / (1000 * 60 * 60);

      // Calculate recency score (exponential decay)
      const recencyScore = Math.exp(-0.05 * postAgeHours);

      // Calculate engagement score
      const likesCount = post.likedBy?.length || 0;
      const commentsCount = post.comments?.length || 0;
      const engagementScore = Math.min((likesCount + commentsCount * 2) / 20, 1.0);

      // Calculate affinity score (simple: is user following the post author?)
      const affinityScore = followings.includes(post.userId) ? 1.0 : 0.3;

      // Calculate final weighted score
      const finalScore = (
        recencyScore * 0.4 +
        engagementScore * 0.3 +
        sourceWeight * 0.2 +
        affinityScore * 0.1
      );

      return {
        ...post,
        _score: finalScore
      };
    });

    // 9. Sort by score (highest first)
    postsWithScores.sort((a: any, b: any) => b._score - a._score);

    // 10. Remove score from response (optional - keep it for debugging)
    // const finalPosts = postsWithScores.map(({ _score, ...post }) => post);

    return { success: true, data: postsWithScores };
  }

  @Get('notifications/:userId')
  async getNotifications(@Param('userId') userId: string) {
    const notifications =
      await this.songPostService.getNotificationsForUser(userId);
    return { success: true, data: notifications };
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    console.log('Received update post request:', updatePostDto);
    const updatedPost = await this.songPostService.updateSongPost(
      id,
      updatePostDto,
    );
    if (!updatedPost) {
      return { success: false, message: 'Post not found' };
    }
    return {
      success: true,
      data: updatedPost,
      message: 'Post updated successfully',
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const deleted = await this.songPostService.deleteSongPost(id);
    if (!deleted) {
      return { success: false, message: 'Post not found' };
    }
    return { success: true, message: 'Post deleted successfully' };
  }

  // Unhide a post (set isHidden = 0)
  @Patch(':id/unhide')
  async unhide(@Param('id') id: string) {
    const post = await this.songPostService.unhidePost(id);
    if (!post) return { success: false, message: 'Post not found' };
    return { success: true, data: post };
  }

  /*
  @Get('user/:userId/count')
  async countPostsByUser(@Param('userId') userId: string) {
    const count = await this.songPostService.countPostsByUser(userId);
    return { userId, postCount: count };
  }
  */
}
