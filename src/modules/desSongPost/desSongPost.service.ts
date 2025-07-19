import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DesSongPost, DesSongPostDocument } from './desSongPost.model';
import { CreateDesSongPostDto } from './dto/create-despost.dto';
import { AddDesCommentDto } from './dto/create-comment.dto';

@Injectable()
export class DesSongPostService {
  constructor(
    @InjectModel(DesSongPost.name)
    private readonly desPostModel: Model<DesSongPostDocument>,
  ) {}

  async createPost(dto: CreateDesSongPostDto) {
    console.log('Incoming DTO:', dto);
    const post = new this.desPostModel({
      ...dto,
      likes: 0,
      likedBy: [],
    });
    return await post.save();
  }

  async addComment(dto: AddDesCommentDto) {
    const post = await this.desPostModel.findById(dto.postId);
    if (!post) throw new NotFoundException('Post not found');

    const comment = {
      id: new Types.ObjectId(),
      userId: dto.userId,
      text: dto.text,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      likedBy: [],
    };

    post.comments.push(comment);
    await post.save();
    return comment;
  }
}
