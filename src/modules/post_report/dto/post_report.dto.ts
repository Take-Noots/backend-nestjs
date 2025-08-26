import { IsString, IsArray, IsMongoId, IsOptional, IsEnum } from 'class-validator';
import { Types } from 'mongoose';

export class CreatePostReportDto {
  @IsMongoId()
  reportedUserId: string;

  @IsMongoId()
  reportedPostId: string;

  @IsString()
  reason: string;
}

export class UpdatePostReportDto {
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class PostReportResponseDto {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedPostId: string;
  reason: string;
  adminNotes?: string;
  reportTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
