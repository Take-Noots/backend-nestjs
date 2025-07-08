import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Fanbase extends Document {
  @Prop()
  description: string;

  @Prop()
  postId?: string;

  @Prop({ default: 0 })
  numberOfLikes: number;

  @Prop({ type: [String], default: [] })
  likedUserIds: string[];

  @Prop({ default: 0 })
  numberOfComments: number;

  @Prop({ type: [String], default: [] })
  comments: string[];

  @Prop({ default: 0 })
  numberOfShares: number;

  @Prop({ type: [String], default: [] })
  sharedUserIds: string[];

  @Prop()
  createdAt: Date;
}

export const FanbaseSchema = SchemaFactory.createForClass(Fanbase);
