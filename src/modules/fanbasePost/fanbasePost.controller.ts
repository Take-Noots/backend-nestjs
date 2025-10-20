import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FanbasePostService } from './fanbasePost.service';
import { CreateFanbasePostDto } from './dto/create-fanbasePost.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtUser, JwtUserData } from '../../common/decorators/jwt-user.decorator';

@Controller('fanbase/:fanbaseId/posts')
@UseGuards(JwtAuthGuard)
export class FanbasePostController {
  constructor(private readonly fanbasePostService: FanbasePostService) {}

  // Create a new FanbasePost
  @Post()
  async create(
    @Param('fanbaseId') fanbaseId: string,
    @Body() createPostDto: CreateFanbasePostDto,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      // Ensure fanbaseId from URL is used
      const postData = { ...createPostDto, fanbaseId };
      return await this.fanbasePostService.create(postData, user.userId);
    } catch (error) {
      throw new HttpException(
        `Failed to create post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getFanbasePosts(
    @Param('fanbaseId') fanbaseId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      const posts = await this.fanbasePostService.findByFanbaseId(
        fanbaseId,
        user.userId,
        page,
        limit,
      );
      return { posts };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch posts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':postId')
  async getPost(
    @Param('fanbaseId') fanbaseId: string,
    @Param('postId') postId: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      return await this.fanbasePostService.findById(postId, user.userId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':postId/like')
  async likePost(
    @Param('fanbaseId') fanbaseId: string,
    @Param('postId') postId: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      return await this.fanbasePostService.likePost(postId, user.userId);
    } catch (error) {
      throw new HttpException(
        `Failed to like/unlike post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':postId/comment')
  async addComment(
    @Param('fanbaseId') fanbaseId: string,
    @Param('postId') postId: string,
    @Body('comment') comment: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      if (!comment || comment.trim().length === 0) {
        throw new HttpException('Comment cannot be empty', HttpStatus.BAD_REQUEST);
      }
      return await this.fanbasePostService.addComment(postId, comment, user.userId);
    } catch (error) {
      throw new HttpException(
        `Failed to add comment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':postId/comment/:commentId/subcomment')
  async addSubComment(
    @Param('fanbaseId') fanbaseId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body('comment') comment: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      if (!comment || comment.trim().length === 0) {
        throw new HttpException('Sub-comment cannot be empty', HttpStatus.BAD_REQUEST);
      }
      return await this.fanbasePostService.addSubComment(postId, comment, user.userId, commentId);
    } catch (error) {
      throw new HttpException(
        `Failed to add sub-comment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':postId')
  async deletePost(
    @Param('fanbaseId') fanbaseId: string,
    @Param('postId') postId: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      return await this.fanbasePostService.deletePost(postId, user.userId);
    } catch (error) {
      throw new HttpException(
        `Failed to delete post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':postId/comment/:commentId')
  async deleteFanbaseComment(
    @Param('fanbaseId') fanbaseId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      return await this.fanbasePostService.deleteComment(postId, commentId, user.userId);
    } catch (error) {
      throw new HttpException(
        `Failed to delete comment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  } 

  @Delete(':postId/comment/:commentId/subcomment/:subCommentId')
  async deleteFanbaseSubComment(
    @Param('fanbaseId') fanbaseId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Param('subCommentId') subCommentId: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      return await this.fanbasePostService.deleteSubComment(postId, commentId, user.userId, subCommentId);
    } catch (error) {
      throw new HttpException(
        `Failed to delete sub-comment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':postId/comment/:commentId/like')
  async likeComment(
    @Param('fanbaseId') fanbaseId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      return await this.fanbasePostService.likeComment(postId, commentId, user.userId);
    } catch (error) {
      throw new HttpException(
        `Failed to like/unlike comment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':postId/comment/:commentId/subcomment/:subCommentId/like')
  async likeSubComment(
    @Param('fanbaseId') fanbaseId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Param('subCommentId') subCommentId: string,
    @JwtUser() user: JwtUserData,
  ) {
    try {
      // ✅ Fix parameter order: (postId, commentId, subCommentId, userId)
      return await this.fanbasePostService.likeSubComment(postId, commentId, subCommentId, user.userId);
    } catch (error) {
      throw new HttpException(
        `Failed to like/unlike sub-comment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}