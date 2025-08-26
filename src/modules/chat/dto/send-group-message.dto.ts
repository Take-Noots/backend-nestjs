// src/modules/group-chat/dto/send-group-message.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class SendGroupMessageDto {
  @IsString()
  @IsNotEmpty()
  groupChatId: string;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  senderUsername: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}