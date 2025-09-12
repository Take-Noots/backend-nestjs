
// src/modules/notification/dto/create-notification.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { NotificationType } from '../notification.model';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  senderUsername: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  data: {
    chatId?: string;
    groupChatId?: string;
    messageText?: string;
    postId?: string;
    postCaption?: string;
    songName?: string;
    artistName?: string;
    fanbasePostId?: string;
    fanbaseId?: string;
    fanbaseName?: string;
    postTopic?: string;
    commentText?: string;
  };
}