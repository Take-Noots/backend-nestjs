import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FanbasePostDocument = FanbasePost & Document;

@Schema()
export class FanbasePostComment {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  comment: string;

  @Prop({ required: true })
  commentId: string;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ type: [String], default: [] })
  likeUserIds: string[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: [] })
  subComments: {
    userId: string;
    userName: string;
    comment: string;
    commentId: string;
    likeCount: number;
    likeUserIds: string[];
    createdAt: Date;
  }[] = [];
}

@Schema({ timestamps: true })
export class FanbasePost {
  @Prop({
    type: {
      userId: { type: String, required: true },
      userName: { type: String, required: true },
    },
    required: true,
  })
  createdBy: {
    userId: string;
    userName: string;
  };

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  spotifyTrackId?: string;

  @Prop()
  songName?: string;

  @Prop()
  artistName?: string;

  @Prop()
  albumArt?: string;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ type: [String], default: [] })
  likeUserIds: string[];

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ type: [FanbasePostComment], default: [] })
  comments: FanbasePostComment[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Fanbase' })
  fanbaseId: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const FanbasePostSchema = SchemaFactory.createForClass(FanbasePost);
