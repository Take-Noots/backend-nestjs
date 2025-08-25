// src/modules/group-chat/dto/add-remove-member.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class AddRemoveMemberDto {
  @IsString()
  @IsNotEmpty()
  groupChatId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}