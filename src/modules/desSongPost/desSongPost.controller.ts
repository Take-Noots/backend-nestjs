import { Body, Controller, UsePipes, Post } from '@nestjs/common';
import { DesSongPostService } from './desSongPost.service';
import { CreateDesSongPostDto } from './dto/create-despost.dto';
import { AddDesCommentDto } from './dto/create-comment.dto';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
// import { DesSongPostDocument } from './desSongPost.model';

@Controller('des-song-posts')
export class DesSongPostController {
  constructor(private readonly desSongPostService: DesSongPostService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createDesPostDto: CreateDesSongPostDto) {
    console.log('BODY RECEIVED:', createDesPostDto);
    return this.desSongPostService.createPost(createDesPostDto);
  }

  @Post('/comment')
  
  addComment(@Body() dto: AddDesCommentDto) {
    return this.desSongPostService.addComment(dto);
  }
}
