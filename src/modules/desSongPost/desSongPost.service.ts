import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DesSongPost, DesSongPostDocument } from './desSongPost.model';
import { CreateDesSongPostDto, AddDesCommentDto } from './dto/create-despost.dto';

@Injectable()
export class DesSongPostService {
  constructor(
    @InjectModel(DesSongPost.name)
    private readonly desSongPostModel: Model<DesSongPostDocument>,
  ) {}

  async create(dto: CreateDesSongPostDto): Promise<DesSongPost> {
    const created = new this.desSongPostModel(dto);
    return await created.save();
  }

  async findAll(): Promise<DesSongPost[]> {
    return this.desSongPostModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<DesSongPost | null> {
    return this.desSongPostModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<DesSongPost[]> {
    return this.desSongPostModel.find({ userId }).exec();
  }

  async likePost(postId: string, userId: string): Promise<DesSongPost | null> {
    const post = await this.desSongPostModel.findById(postId);
    if (!post) return null;

    if (!post.likedUserIds.includes(userId)) {
      post.likedUserIds.push(userId);
      post.likes += 1;
      await post.save();
    }

    return post;
  }

  async addComment(postId: string, dto: AddDesCommentDto): Promise<DesSongPost | null> {
    const post = await this.desSongPostModel.findById(postId);
    if (!post) return null;

    post.comments.push({
      userId: dto.userId,
      text: dto.text,
      username: '', // Fetch separately if needed
      likes: 0,
      likedUserIds: [],
      createdAt: new Date(),
    });

    await post.save();
    return post;
  }

  async likeComment(postId: string, commentId: string, userId: string): Promise<DesSongPost | null> {
    const post = await this.desSongPostModel.findById(postId);
    if (!post) return null;

    const comment = post.comments.id(commentId);
    if (!comment || comment.likedUserIds.includes(userId)) return null;

    comment.likedUserIds.push(userId);
    comment.likes += 1;

    await post.save();
    return post;
  }
}
