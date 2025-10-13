import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  Patch, //for hidden post
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SongPostService } from './songPost.service';
import {
  CreatePostDto,
  UpdatePostDto,
  AddCommentDto,
} from './dto/create-post.dto';
import { SongPost, SongPostDocument } from './songPost.model';
import { ProfileService } from '../profile/profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtUser, JwtUserData } from '../../common/decorators/jwt-user.decorator';

import { Delete } from '@nestjs/common';

@Controller('song-posts')
export class SongPostController {
  constructor(
    private readonly songPostService: SongPostService,
    private readonly profileService: ProfileService,
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
    console.log('Received create post request:', createPostDto);
    console.log('User from JWT:', user);
    
    // Add the userId from JWT token to the DTO
    createPostDto.userId = user.userId;
    
    // username will be fetched in the service, not from DTO
    const createdPost = await this.songPostService.create(createPostDto);

    return createdPost;
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
    console.log(`[DEBUG] Controller likeComment: postId=${postId}, commentId=${commentId}, userId=${user.userId}`);
    
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

  @Get('followers/:userId')
  async getFollowerPosts(@Param('userId') userId: string) {
    // 1. Get followers
    const followers = await this.profileService.getFollowers(userId);
    // 2. Get posts by followers
    const posts = await this.songPostService.getPostsByUserIds(followers);
    // 3. Print to terminal (already done in service)
    return { success: true, data: posts };
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
