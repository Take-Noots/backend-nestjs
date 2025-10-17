import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateThoughtsDto {

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  thoughtsText: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsBoolean()
  @IsOptional()
  inAFanbase?: boolean;

  @IsString()
  @IsOptional()
  FanbaseID?: string;

  @IsString()
  @IsOptional()
  songName?: string;

  @IsString()
  @IsOptional()
  artistName?: string;

  @IsString()
  @IsOptional()
  trackId?: string;

  @IsString()
  @IsOptional()
  backgroundColor?: string;
}

export class AddThoughtsCommentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}

export class LikeThoughtsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
