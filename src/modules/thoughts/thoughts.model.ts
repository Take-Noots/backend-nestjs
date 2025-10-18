import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ThoughtsPostDocument = ThoughtsPost & Document;

@Schema({ timestamps: true })
export class ThoughtsPost {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  thoughtsText: string;

  @Prop({ required: false })
  coverImage?: string;

  @Prop({ type: [String], default: [] })
  likedBy: string[];

  @Prop({ default: 0 })
  likes: number;

  @Prop({
    type: [
      {
        userId: String,
        text: String,
        createdAt: Date,
        updatedAt: Date,
        id: { type: Types.ObjectId, default: () => new Types.ObjectId() },
        likes: { type: Number, default: 0 },
        likedBy: { type: [String], default: [] },
      },
    ],
    default: [],
  })
  comments: any[];

  @Prop({ default: false })
  inAFanbase: boolean;

  @Prop({ default: null })
  FanbaseID: string;
  
  @Prop({ required: false })
  songName?: string;

  @Prop({ required: false })
  artistName?: string;

  @Prop({ required: false })
  trackId?: string;

  @Prop({ required: false })
  backgroundColor?: string;

  // Moderation fields
  @Prop({ default: 0 })
  isHidden: number; // 0 = visible, 1 = hidden

  @Prop({ default: 0 })
  isDeleted: number; // 0 = not deleted, 1 = deleted
}

export const ThoughtsPostSchema = SchemaFactory.createForClass(ThoughtsPost);
