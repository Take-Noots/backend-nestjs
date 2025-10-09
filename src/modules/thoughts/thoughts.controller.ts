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
  getThoughtsByUser(@Param('userId') userId: string) {
    return this.thoughtsService.findByUserId(userId);
  }

  @Get('followers/:userId')
  getFollowerPosts(@Param('userId') userId: string) {
    return this.thoughtsService.getFollowerPosts(userId);
  }


  // Like/unlike a thoughts post
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  likeThoughts(@Param('id') id: string, @Body() dto: LikeThoughtsDto, @JwtUser() user: JwtUserData) {
    dto.userId = user.userId;
    
    return this.thoughtsService.likePost(id, dto);
  }

  // Add comment to thoughts post
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  addComment(@Param('id') id: string, @Body() dto: AddThoughtsCommentDto, @JwtUser() user: JwtUserData) {
    dto.userId = user.userId;
    return this.thoughtsService.addComment(id, dto);
  }

  // Hide thoughts post
  @Patch(':id/hide')
  hideThoughts(@Param('id') id: string) {
    return this.thoughtsService.hidePost(id);
  }
  
  // Delete thoughts post
  @Delete(':id')
  deleteThoughts(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.thoughtsService.deletePost(id, body.userId);
  }
}
