import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  isHidden?: number;
  
  @IsString()
  @IsNotEmpty()
  trackId: string;

  @IsString()
  @IsNotEmpty()
  songName: string;

  @IsString()
  @IsNotEmpty()
  artists: string;

  @IsString()
  @IsOptional()
  albumImage?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class AddCommentDto {
  userId: string;
  text: string;
}
