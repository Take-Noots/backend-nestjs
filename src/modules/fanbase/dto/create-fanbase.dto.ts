// src/fanbase/dto/create-fanbase.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFanbaseDto {
  @IsNotEmpty()
  @IsString()
  createdUserId: string;

  @IsNotEmpty()
  @IsString()
  topic: string;

  @IsOptional()
  @IsString()
  postId?: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}
