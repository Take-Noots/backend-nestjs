import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateFanbasePostDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  fanbaseId: string;

  @IsString()
  @IsOptional()
  spotifyTrackId?: string;

  @IsString()
  @IsOptional()
  songName?: string;

  @IsString()
  @IsOptional()
  artistName?: string;

  @IsString()
  @IsOptional()
  albumArt?: string;
}


