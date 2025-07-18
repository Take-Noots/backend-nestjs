// src/modules/chat/dto/send-message.dto.ts
import { IsNotEmpty, IsString, IsMongoId, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  chatId: string;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  senderUsername: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  text: string;
}