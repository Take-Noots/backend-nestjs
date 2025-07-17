// src/modules/fanbases/fanbase.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type FanbaseDocument = HydratedDocument<Fanbase>;

@Schema()
export class Fanbase {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  fanbaseName: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  createdUserId: string; // Match database field name

  @Prop({ required: false })
  fanbasePhotoUrl: string;

  // Likes tracking
  @Prop({ default: 0 })
  numberOfLikes: number;

  @Prop([{ type: String }]) // Array of user IDs who liked
  likedUserIds: string[];

  // Posts tracking  
  @Prop({ default: 0 })
  numberOfPosts: number; // Number of posts in this fanbase

  @Prop([{ type: String }]) // Array of post IDs
  postIds: string[];

  // Comments tracking
  @Prop({ default: 0 })
  numberOfComments: number; // Total comments across all posts in this fanbase

  @Prop({ default: Date.now })
  createdAt: Date;

  // Mongoose version field
  @Prop({ default: 0 })
  __v: number;
}

export const FanbaseSchema = SchemaFactory.createForClass(Fanbase);