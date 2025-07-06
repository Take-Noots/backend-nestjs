import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SongPostDocument = SongPost & Document & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

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

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: 0 })
  comments: number;
}

export const SongPostSchema = SchemaFactory.createForClass(SongPost);
