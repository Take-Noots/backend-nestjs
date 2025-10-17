import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SongPostDocument = SongPost &
  Document & {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ type: [String], default: [] })
  likedBy: string[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

@Schema({ timestamps: true })
export class SongPost {
  @Prop({ required: true })
  trackId: string;

  @Prop({ required: true })
  songName: string;

  @Prop({ required: true })
  artists: string;

  @Prop()
  albumImage?: string;

  @Prop()
  caption?: string;

  @Prop()
  backgroundColor?: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ type: [CommentSchema], default: [] })
  comments: Comment[];

  @Prop({ type: [String], default: [] })
  likedBy: string[];

  @Prop({ default: 0 })
  isHidden: number;

  @Prop()
  isDeleted: number;
}

export const SongPostSchema = SchemaFactory.createForClass(SongPost);
