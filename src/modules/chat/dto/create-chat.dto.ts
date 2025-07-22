// src/modules/chat/dto/create-chat.dto.ts
import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  receiverId: string;
}