// src/modules/chat/chat.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

@Schema()
export class Message {
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

export const MessageSchema = SchemaFactory.createForClass(Message);

@Schema({ timestamps: true })
export class Chat {
  // Remove the manual _id declaration - let Mongoose handle it automatically
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[];

  @Prop({ type: MessageSchema, required: false })
  lastMessage?: Message;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Indexes for better performance
ChatSchema.index({ participants: 1 });
ChatSchema.index({ 'lastMessage.timestamp': -1 });