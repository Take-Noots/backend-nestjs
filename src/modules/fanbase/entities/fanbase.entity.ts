import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class Fanbase extends Document {
  @Prop({ required: true })
  createdUserId: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  postId?: string;

  // Default values for stats (can be updated later)
  @Prop({ default: 0 })
  numberOfLikes: number;

  @Prop({ type: [String], default: [] })
  likedUserIds: string[];

  @Prop({ default: 0 })
  numberOfComments: number;

  @Prop({ type: [String], default: [] })
  commentedUserIds: string[];

  @Prop({ type: [String], default: [] }) // Placeholder; can be sub-documents
  comments: string[];

  @Prop({ default: 0 })
  numberOfShares: number;

  @Prop({ type: [String], default: [] })
  sharedUserIds: string[];

  @Prop()
  createdAt: Date;
}

export const FanbaseSchema = SchemaFactory.createForClass(Fanbase);
