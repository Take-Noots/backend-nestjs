import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
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

  @IsString()
  @IsNotEmpty()
  username: string;
}

export class AddCommentDto {
  userId: string;
  username: string;
  text: string;
}
