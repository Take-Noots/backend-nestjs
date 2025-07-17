import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  role: string;

  // Ban/Block related fields for admin functionality
  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ required: false })
  banReason: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  bannedBy: mongoose.Schema.Types.ObjectId;

  @Prop({ required: false })
  bannedAt: Date;

  @Prop({ required: false })
  banUntil: Date;

  // Activity tracking
  @Prop({ default: Date.now })
  lastActive: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
