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

  @Prop()
  fullName?: string;

  @Prop()
  userType?: string;

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

  @Prop({ type: [String], default: [] })
  savedPosts: string[]; 

  @Prop({ type: [String], default: [] })
  savedThoughtsPosts: string[]; 
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
