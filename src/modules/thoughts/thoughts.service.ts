import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ThoughtsPost, ThoughtsPostDocument } from './thoughts.model';
import { CreateThoughtsDto, AddThoughtsCommentDto, LikeThoughtsDto } from './dto/create-thoughts.dto';

@Injectable()
export class ThoughtsService {
  constructor(
    @InjectModel(ThoughtsPost.name)
    private readonly thoughtsModel: Model<ThoughtsPostDocument>,
  ) {}

  // Create a new thoughts post
  async createThoughts(dto: CreateThoughtsDto): Promise<ThoughtsPostDocument> {
    console.log('Creating thoughts post:', dto);
    const thoughtsPost = new this.thoughtsModel({
      ...dto,
      likes: 0,
      likedBy: [],
      comments: [],
    });
    const savedPost = await thoughtsPost.save();
    console.log('Thoughts post created successfully:', savedPost._id);
    return savedPost;
  }



  // Get thoughts post by ID
  async findById(id: string): Promise<ThoughtsPostDocument | null> {
    return this.thoughtsModel.findById(id).exec();
  }

  // Get thoughts posts by user ID
  async findByUserId(userId: string): Promise<ThoughtsPostDocument[]> {
    return this.thoughtsModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  // Like a thoughts post
  async likePost(postId: string, dto: LikeThoughtsDto): Promise<ThoughtsPostDocument | null> {
    const post = await this.thoughtsModel.findById(postId);
    if (!post) return null;

    const index = post.likedBy.indexOf(dto.userId);
    if (index === -1) {
      post.likedBy.push(dto.userId);
    } else {
      post.likedBy.splice(index, 1);
    }
    post.likes = post.likedBy.length;
    await post.save();
    return post;
  }

  // Add comment to thoughts post
  async addComment(postId: string, dto: AddThoughtsCommentDto): Promise<any> {
    const post = await this.thoughtsModel.findById(postId);
    if (!post) throw new NotFoundException('Thoughts post not found');

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
    console.log('Comment added to thoughts post:', comment);
    return comment;
  }

  // Delete thoughts post
  async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await this.thoughtsModel.findById(postId);
    if (!post || post.userId !== userId) return false;

    await this.thoughtsModel.findByIdAndDelete(postId);
    return true;
  }
}
