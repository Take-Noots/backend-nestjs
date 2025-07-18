import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DesSongPostDocument = DesSongPost & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: '' })
  username: string;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ type: [String], default: [] })
  likedUserIds: string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

@Schema({ timestamps: true })
export class DesSongPost {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  songTitle: string;

  @Prop({ required: true })
  albumArtUrl: string;

  @Prop()
  description: string;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ type: [String], default: [] })
  likedUserIds: string[];

  @Prop({ type: [CommentSchema], default: [] }) 
  comments: Types.DocumentArray<Comment>;
}

export const DesSongPostSchema = SchemaFactory.createForClass(DesSongPost);
