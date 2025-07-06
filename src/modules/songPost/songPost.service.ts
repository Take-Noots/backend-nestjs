import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SongPost, SongPostDocument } from './songPost.model';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class SongPostService {
  constructor(
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<SongPostDocument> {
    console.log('Creating new song post:', createPostDto);
    
    const createdPost = new this.songPostModel(createPostDto);
    const savedPost = await createdPost.save();
    
    console.log('Song post created successfully:', savedPost);
    return savedPost;
  }

  async findAll(): Promise<SongPostDocument[]> {
    return this.songPostModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<SongPostDocument | null> {
    return this.songPostModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<SongPostDocument[]> {
    return this.songPostModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}
