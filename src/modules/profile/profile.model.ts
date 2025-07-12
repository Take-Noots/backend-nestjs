// profile.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProfileDocument = Profile &
  Document & {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class Profile {
  @Prop({ required: true, unique: true }) // Same userId used in SongPost
  userId: string;

  @Prop({ required: true, unique: true }) // Used in SongPost
  username: string;

  @Prop()
  profileImage?: string;

  @Prop()
  bio?: string;

  @Prop({ default: 0 })
  posts: number;

  @Prop({ default: 0 })
  followers: number;

  @Prop({ default: 0 })
  following: number;

  @Prop({ type: [String], default: [] })
  albumArts: string[];
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
