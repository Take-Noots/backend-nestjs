import { Controller, Post, Get, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { SongPostService } from './songPost.service';
import { CreatePostDto } from './dto/create-post.dto';
import { SongPost, SongPostDocument } from './songPost.model';

@Controller('song-posts')
export class SongPostController {
  constructor(private readonly songPostService: SongPostService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createPostDto: CreatePostDto): Promise<SongPostDocument> {
    console.log('Received create post request:', createPostDto);
    const createdPost = await this.songPostService.create(createPostDto);
    
    
    return createdPost;
  }

  @Get()
  async findAll(): Promise<SongPostDocument[]> {
    const posts = await this.songPostService.findAll();
    
    
    return posts;
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<SongPostDocument | null> {
    return this.songPostService.findById(id);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string): Promise<SongPostDocument[]> {
    return this.songPostService.findByUserId(userId);
  }
}
