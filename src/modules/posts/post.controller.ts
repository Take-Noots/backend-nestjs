// src/modules/posts/post.controller.ts
import { Controller, Get, Post, Delete, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDTO } from './dto/create-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async createPost(@Body() createPostDto: CreatePostDTO) {
    try {
      return await this.postService.create(createPostDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    try {
      const post = await this.postService.findById(id);
      if (!post) {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      }
      return post;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('user/:userId')
  async getPostsByUser(@Param('userId') userId: string) {
    try {
      return await this.postService.findByUserId(userId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch user posts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async getAllPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    try {
      const skip = (page - 1) * limit;
      return await this.postService.findAllWithPagination({}, skip, limit);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch posts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}