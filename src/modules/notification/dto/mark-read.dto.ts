// src/modules/notification/dto/mark-read.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class MarkReadDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}