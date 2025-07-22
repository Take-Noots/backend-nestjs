import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SongPost, SongPostDocument } from './songPost.model';
import { CreatePostDto, AddCommentDto } from './dto/create-post.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class SongPostService {
  constructor(
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
    private readonly userService: UserService,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<SongPostDocument> {
    console.log('Creating new song post:', createPostDto);

    // Fetch username from UserService (for future use, but not stored in SongPost)
    // const username = await this.userService.getUsernameById(createPostDto.userId);
    // if (!username) {
    //   throw new Error('User not found for given userId');
    // }

    // Only use properties defined in the schema
    const createdPost = new this.songPostModel({
      ...createPostDto,
    });
    const savedPost = await createdPost.save();

    console.log('Song post created successfully:', savedPost);
    return savedPost;
  }

  async findAll(): Promise<SongPostDocument[]> {
    return this.songPostModel.find().sort({ createdAt: -1 }).exec();
  }

  async findAllWithUsernames(): Promise<any[]> {
    const posts = await this.songPostModel
      .find()
      .sort({ createdAt: -1 })
      .lean();
    // Assuming you have access to userService
    return Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        return {
          ...post,
          username: username || '', // fallback if not found
          comments: await Promise.all(
            (post.comments || []).map(async (comment) => ({
              ...comment,
              username:
                (await this.userService.getUsernameById(comment.userId)) || '',
            })),
          ),
        };
      }),
    );
  }

  async findById(id: string): Promise<SongPostDocument | null> {
    return this.songPostModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<SongPostDocument[]> {
    return this.songPostModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async likePost(
    postId: string,
    userId: string,
  ): Promise<SongPostDocument | null> {
    const post = await this.songPostModel.findById(postId);
    if (!post) return null;

    // Toggle like
    const index = post.likedBy.indexOf(userId);
    if (index === -1) {
      post.likedBy.push(userId);
    } else {
      post.likedBy.splice(index, 1);
    }
    post.likes = post.likedBy.length;
    await post.save();
    return post;
  }

  async addComment(
    postId: string,
    addCommentDto: AddCommentDto,
  ): Promise<SongPostDocument | null> {
    const post = await this.songPostModel.findById(postId);
    if (!post) return null;
    // Fetch username from UserService (for future use, but not stored in comment)
    const username = await this.userService.getUsernameById(
      addCommentDto.userId,
    );
    if (!username) {
      throw new Error('User not found for given userId');
    }

    post.comments.push({
      ...addCommentDto,
      username,
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
    });
    await post.save();
    return post;
  }

  async likeComment(
    postId: string,
    commentId: string,
    userId: string,
  ): Promise<SongPostDocument | null> {
    const post = await this.songPostModel.findById(postId);
    if (!post) return null;
    const comment = post.comments.find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) return null;

    const index = comment.likedBy.indexOf(userId);
    if (index === -1) {
      comment.likedBy.push(userId);
    } else {
      comment.likedBy.splice(index, 1);
    }
    comment.likes = comment.likedBy.length;
    await post.save();
    return post;
  }

  async getPostsByUserIds(userIds: string[]): Promise<any[]> {
    // Find posts where userId is in the userIds array
    const posts = await this.songPostModel
      .find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();
    // Attach username for each post
    const postsWithUsernames = await Promise.all(
      posts.map(async (post) => {
        const username = await this.userService.getUsernameById(post.userId);
        return {
          ...post,
          username: username || '',
        };
      }),
    );
    //console.log('Follower posts with usernames:', postsWithUsernames);
    return postsWithUsernames;
  }
}
