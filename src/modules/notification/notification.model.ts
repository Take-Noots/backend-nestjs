// src/modules/notification/notification.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  MESSAGE = 'message',
  GROUP_MESSAGE = 'group_message',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  FANBASE_POST_LIKE = 'fanbase_post_like',
  FANBASE_POST_COMMENT = 'fanbase_post_comment',
  ADMIN_WARNING = 'admin_warning',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  senderUsername: string;

  @Prop({ enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object, required: true })
  data: {
    // For messages
    chatId?: string;
    groupChatId?: string;
    messageText?: string;
    
    // For posts
    postId?: string;
    postCaption?: string;
    songName?: string;
    artistName?: string;
    
    // For fanbase posts
    fanbasePostId?: string;
    fanbaseId?: string;
    fanbaseName?: string;
    postTopic?: string;
    
    // For comments
    commentText?: string;

    // For group messages
    groupName?: string;
  };

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for better performance
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days