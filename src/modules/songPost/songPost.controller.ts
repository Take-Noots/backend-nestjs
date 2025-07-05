import { Controller, Post, Get, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { SongPostService } from './songPost.service';
import { CreatePostDto } from './dto/create-post.dto';
import { SongPost } from './songPost.model';

@Controller('song-posts')
export class SongPostController {
  constructor(private readonly songPostService: SongPostService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createPostDto: CreatePostDto): Promise<SongPost> {
    console.log('Received create post request:', createPostDto);
    return this.songPostService.create(createPostDto);
  }

  @Get()
  async findAll(): Promise<SongPost[]> {
    return this.songPostService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<SongPost | null> {
    return this.songPostService.findById(id);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string): Promise<SongPost[]> {
    return this.songPostService.findByUserId(userId);
  }
}
