// src/modules/group-chat/dto/update-group-chat.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateGroupChatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  groupIcon?: string;
}