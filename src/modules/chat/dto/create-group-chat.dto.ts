// src/modules/group-chat/dto/create-group-chat.dto.ts
import { IsString, IsOptional, IsArray, ArrayMinSize, IsNotEmpty } from 'class-validator';

export class CreateGroupChatDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  groupIcon?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  memberIds: string[];
}