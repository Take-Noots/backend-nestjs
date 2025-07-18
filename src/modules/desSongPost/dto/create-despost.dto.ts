import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDesSongPostDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  songTitle: string;

  @IsNotEmpty()
  @IsString()
  albumArtUrl: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AddDesCommentDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  text: string;
}
