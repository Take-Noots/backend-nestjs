import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DesSongPostDocument = DesSongPost & Document;

@Schema({ timestamps: true })
export class DesSongPost {
  @Prop()
  songName: string;

  @Prop()
  albumImage: string;

  @Prop()
  artists: string;

  @Prop()
  trackid: string;

  @Prop()
  userId: string;

  @Prop({ type: [String], default: [] })
  likedBy: string[];

  @Prop({ default: 0 })
  likes: number;

  @Prop()
  topic: string;

  @Prop()
  description: string;

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
}

export const DesSongPostSchema = SchemaFactory.createForClass(DesSongPost);
