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

  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'])
  status?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;
}

export class ReviewPostReportDto {
  @IsEnum(['approved', 'rejected'])
  status: string;

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
  status: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reportTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
