import {
  Controller, Post, Get, Param, Body, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { DesSongPostService } from './desSongPost.service';
import { CreateDesSongPostDto, AddDesCommentDto } from './dto/create-despost.dto'
import { DesSongPost } from './desSongPost.model';

@Controller('des-song-posts')
export class DesSongPostController {
  constructor(private readonly desSongPostService: DesSongPostService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() dto: CreateDesSongPostDto): Promise<DesSongPost> {
    return this.desSongPostService.create(dto);
  }

  @Get()
  async findAll(): Promise<DesSongPost[]> {
    return this.desSongPostService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<DesSongPost | null> {
    return this.desSongPostService.findById(id);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string): Promise<DesSongPost[]> {
    return this.desSongPostService.findByUserId(userId);
  }

  @Post(':id/like')
  async likePost(@Param('id') id: string, @Body('userId') userId: string) {
    const post = await this.desSongPostService.likePost(id, userId);
    return post ? { success: true, data: post } : { success: false, message: 'Post not found' };
  }

  @Post(':id/comment')
  async addComment(@Param('id') id: string, @Body() dto: AddDesCommentDto) {
    const post = await this.desSongPostService.addComment(id, dto);
    return post ? { success: true, data: post } : { success: false, message: 'Post not found' };
  }

  @Post(':postId/comment/:commentId/like')
  async likeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body('userId') userId: string,
  ) {
    const post = await this.desSongPostService.likeComment(postId, commentId, userId);
    return post ? { success: true, data: post } : { success: false, message: 'Comment or post not found' };
  }
}
