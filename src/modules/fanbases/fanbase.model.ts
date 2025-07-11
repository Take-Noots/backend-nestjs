// src/modules/fanbases/fanbase.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type FanbaseDocument = HydratedDocument<Fanbase>;

@Schema()
export class Fanbase {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: false })
  imageUrl: string;

  @Prop({ required: false })
  category: string; // genre, artist, mood, etc.

  // Members and activity
  @Prop({ default: 0 })
  membersCount: number;

  @Prop({ default: 0 })
  postsCount: number;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  moderators: Types.ObjectId[];

  // Privacy and moderation
  @Prop({ default: 'public' })
  visibility: string; // 'public', 'private'

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ required: false })
  deletedReason: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  deletedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const FanbaseSchema = SchemaFactory.createForClass(Fanbase);