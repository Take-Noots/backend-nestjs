import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class RecentlyLikedUserList extends Document {
  @Prop({ required: true, unique: true })
  userId: string; // The user who performed the likes

  @Prop({ type: [String], default: [] })
  recentlyLikedPostIds: string[]; // Array of post IDs that were recently liked
}

export const RecentlyLikedUserListSchema = SchemaFactory.createForClass(RecentlyLikedUserList);
