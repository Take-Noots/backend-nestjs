import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Fanbase extends Document {
  @Prop({ required: true })
  fanbaseName: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  createdUserId: string;

  @Prop({ required: true })
  fanbasePhotoUrl: string;

  @Prop({ default: 0 })
  numberOfLikes: number;

  @Prop({ type: [String], default: [] })
  likedUserIds: string[];

  @Prop({ default: 0 })
  numberOfPosts: number;

  @Prop({ type: [String], default: [] })
  postIds: string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const FanbaseSchema = SchemaFactory.createForClass(Fanbase);
