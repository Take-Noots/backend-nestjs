import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { ThoughtsService } from './thoughts.service';
import { CreateThoughtsDto, AddThoughtsCommentDto, LikeThoughtsDto } from './dto/create-thoughts.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtUser, JwtUserData } from '../../common/decorators/jwt-user.decorator';

@Controller('thoughts')
export class ThoughtsController {
  constructor(private readonly thoughtsService: ThoughtsService) {}

  // Create a new thoughts post
  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createThoughts(@Body() dto: CreateThoughtsDto, @JwtUser() user: JwtUserData) {
    console.log('Received create thoughts request:', dto);
    console.log('User from JWT:', user);
    
    // Add the userId from JWT token to the DTO
    dto.userId = user.userId;
    
    return this.thoughtsService.createThoughts(dto);
  }

  // Get thoughts post by ID (for individual post viewing)
  @Get(':id')
  getThoughtsById(@Param('id') id: string) {
    return this.thoughtsService.findById(id);
  }

  // Get thoughts posts by user ID (for user profile)
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  getThoughtsByUser(@Param('userId') userId: string, @JwtUser() user: JwtUserData) {
    return this.thoughtsService.findByUserId(userId, user.userId);
  }

  @Get('followers/:userId')
  @UseGuards(JwtAuthGuard)
  getFollowerPosts(@Param('userId') userId: string, @JwtUser() user: JwtUserData) {
    return this.thoughtsService.getFollowerPosts(userId, user.userId);
  }


  // Like/unlike a thoughts post
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likeThoughts(@Param('id') id: string, @JwtUser() user: JwtUserData) {
    const post = await this.thoughtsService.likePost(id, user.userId);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }
    return { success: true, data: post };
  }

  // Add comment to thoughts post
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  async addComment(@Param('id') id: string, @Body() dto: AddThoughtsCommentDto, @JwtUser() user: JwtUserData) {
    console.log('[DEBUG] AddComment: Post ID:', id);
    console.log('[DEBUG] AddComment: DTO:', dto);
    console.log('[DEBUG] AddComment: JWT User:', user);
    
    // Verify that the userId in the request matches the authenticated user
    if (dto.userId !== user.userId) {
      console.log('[DEBUG] AddComment: User ID mismatch - DTO userId:', dto.userId, 'JWT userId:', user.userId);
      return { success: false, message: 'User ID mismatch' };
    }
    
    console.log('[DEBUG] AddComment: User IDs match, proceeding with service call');
    const post = await this.thoughtsService.addComment(id, dto);
    return { success: true, data: post };
  }

  // Get comments for a thoughts post
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.thoughtsService.findById(id);
  }

  // Like/unlike a thoughts comment
  @Post(':id/comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  async likeComment(@Param('id') id: string, @Param('commentId') commentId: string, @JwtUser() user: JwtUserData) {
    const post = await this.thoughtsService.likeComment(id, commentId, user.userId);
    if (!post) {
      return { success: false, message: 'Post or comment not found' };
    }
    return { success: true, data: post };
  }

  // Update thoughts post
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  async updateThoughts(@Param('id') id: string, @Body() updateData: { thoughtsText: string }, @JwtUser() user: JwtUserData) {
    console.log('Received update thoughts request:', updateData);
    const updatedPost = await this.thoughtsService.updatePost(id, updateData);
    if (!updatedPost) {
      return { success: false, message: 'Post not found' };
    }
    return {
      success: true,
      data: updatedPost,
      message: 'Post updated successfully',
    };
  }

  // Hide thoughts post
  @Patch(':id/hide')
  hideThoughts(@Param('id') id: string) {
    return this.thoughtsService.hidePost(id);
  }

  // Unhide thoughts post
  @Patch(':id/unhide')
  async unhideThoughts(@Param('id') id: string) {
    const post = await this.thoughtsService.unhidePost(id);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }
    return { success: true, message: 'Post unhidden successfully', data: post };
  }

  // Get hidden thoughts posts by user ID
  @Get('user/:userId/hidden')
  async getHiddenThoughtsByUser(@Param('userId') userId: string) {
    const posts = await this.thoughtsService.getHiddenPostsByUserId(userId);
    return { success: true, data: posts };
  }
  
  // Delete thoughts post
  @Delete(':id')
  deleteThoughts(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.thoughtsService.deletePost(id, body.userId);
  }
}
