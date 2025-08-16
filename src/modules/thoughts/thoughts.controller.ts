import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe, Delete } from '@nestjs/common';
import { ThoughtsService } from './thoughts.service';
import { CreateThoughtsDto, AddThoughtsCommentDto, LikeThoughtsDto } from './dto/create-thoughts.dto';

@Controller('thoughts')
export class ThoughtsController {
  constructor(private readonly thoughtsService: ThoughtsService) {}

  // Create a new thoughts post
  @Post()
  @UsePipes(new ValidationPipe())
  createThoughts(@Body() dto: CreateThoughtsDto) {
    console.log('Received create thoughts request:', dto);
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
  @UsePipes(new ValidationPipe())
  likeThoughts(@Param('id') id: string, @Body() dto: LikeThoughtsDto) {
    return this.thoughtsService.likePost(id, dto);
  }

  // Add comment to thoughts post
  @Post(':id/comments')
  @UsePipes(new ValidationPipe())
  addComment(@Param('id') id: string, @Body() dto: AddThoughtsCommentDto) {
    return this.thoughtsService.addComment(id, dto);
  }

  
  // Delete thoughts post
  @Delete(':id')
  deleteThoughts(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.thoughtsService.deletePost(id, body.userId);
  }
}
