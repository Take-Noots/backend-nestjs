// src/modules/group-chat/group-chat.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GroupChatDocument = HydratedDocument<GroupChat>;

@Schema()
export class GroupMessage {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  senderUsername: string;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const GroupMessageSchema = SchemaFactory.createForClass(GroupMessage);

@Schema({ timestamps: true })
export class GroupChat {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  groupIcon?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [GroupMessageSchema], default: [] })
  messages: GroupMessage[];

  @Prop({ type: GroupMessageSchema, required: false })
  lastMessage?: GroupMessage;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const GroupChatSchema = SchemaFactory.createForClass(GroupChat);

// Indexes for better performance
GroupChatSchema.index({ members: 1 });
GroupChatSchema.index({ 'lastMessage.timestamp': -1 });
GroupChatSchema.index({ createdBy: 1 });