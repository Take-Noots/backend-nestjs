// src/modules/posts/post.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema()
export class Post {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  postType: string; // 'song-focused' or 'description-focused'

  // Spotify song data
  @Prop({ required: true })
  spotifyTrackId: string;

  @Prop({ required: true })
  songTitle: string;

  @Prop({ required: true })
  artistName: string;

  @Prop({ required: true })
  albumArt: string;

  @Prop({ required: false })
  albumName: string;

  // Interaction counts
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0 })
  sharesCount: number;

  // Fanbase association
  @Prop({ type: Types.ObjectId, ref: 'Fanbase', required: false })
  fanbaseId: Types.ObjectId;

  // Moderation
  @Prop({ default: false })
  isReported: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ required: false })
  deletedReason: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  deletedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);