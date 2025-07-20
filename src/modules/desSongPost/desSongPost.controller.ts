import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { DesSongPostService } from './desSongPost.service';
import { CreateDesSongPostDto } from './dto/create-despost.dto';
import { AddDesCommentDto } from './dto/create-comment.dto';
import { LikePostDto } from './dto/like-post.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { AddPostToFanbaseDto } from './dto/add-to-fanbase.dto';

@Controller('des-song-posts')
export class DesSongPostController {
  constructor(private readonly service: DesSongPostService) {}

  // Create a new DesSongPost
  @Post()
  @UsePipes(new ValidationPipe())
  createPost(@Body() dto: CreateDesSongPostDto) {
    return this.service.createPost(dto);
  }

  // Get all posts
  @Get()
  getAllPosts() {
    return this.service.findAll();
  }

  // Get all posts with usernames
  @Get('with-usernames')
  getAllPostsWithUsernames() {
    return this.service.findAllWithUsernames();
  }

  // Get a post by ID
  @Get(':id')
  getPostById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // Get posts by a specific user
  @Get('user/:userId')
  getPostsByUser(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  // Add a comment to a specific post
  @Post(':postId/comments')
  addCommentToPost(@Param('postId') postId: string, @Body() dto: AddDesCommentDto) {
    return this.service.addComment({ ...dto, postId });
  }

  // Like a post
  @Post(':postId/like')
  likePost(@Param('postId') postId: string, @Body() dto: LikePostDto) {
    return this.service.likePost({ ...dto, postId });
  }

  // Unlike a post
  @Post(':postId/unlike')
  unlikePost(@Param('postId') postId: string, @Body() dto: LikePostDto) {
    return this.service.unlikePost({ ...dto, postId });
  }

  // Like a comment
  @Post(':postId/comments/:commentId/like')
  likeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: LikeCommentDto,
  ) {
    return this.service.likeComment({ ...dto, postId, commentId });
  }

  // Unlike a comment
  @Post(':postId/comments/:commentId/unlike')
  unlikeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: LikeCommentDto,
  ) {
    return this.service.unlikeComment({ ...dto, postId, commentId });
  }

  // Get posts by an array of userIds (following feed)
  @Post('by-following')
  getPostsByFollowing(@Body() body: { userIds: string[] }) {
    return this.service.getPostsByUserIds(body.userIds);
  }

  // Get posts that belong to a specific fanbase
  @Get('fanbase/:fanbaseId')
  getPostsByFanbase(@Param('fanbaseId') fanbaseId: string) {
    return this.service.getPostsByFanbaseId(fanbaseId);
  }

  // Get posts related to a specific song
  @Get('song/:songId')
  getPostsBySong(@Param('songId') songId: string) {
    return this.service.getPostsBySongId(songId);
  }

  // Add an existing post to a fanbase
  @Post(':postId/fanbase/add')
  addPostToFanbase(@Param('postId') postId: string, @Body() dto: AddPostToFanbaseDto) {
    return this.service.addPostToFanbase({ ...dto, postId });
  }

  // Create a post and associate it with a fanbase at the same time
  @Post('with-fanbase')
  createPostWithFanbase(@Body() dto: CreateDesSongPostDto & { fanbaseId: string }) {
    return this.service.createPostWithFanbase(dto, dto.fanbaseId);
  }
}
