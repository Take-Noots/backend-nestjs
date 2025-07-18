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
  @Prop({ required: true, unique: true })
  userId: string;

  // username removed

  @Prop()
  profileImage?: string;

  @Prop()
  bio?: string;

  @Prop({ default: 0 })
  posts: number;

  @Prop({ type: [String], default: [] })
  followers: string[];

  @Prop({ type: [String], default: [] })
  following: string[];

  @Prop({ type: [String], default: [] })
  albumArts: string[];
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
