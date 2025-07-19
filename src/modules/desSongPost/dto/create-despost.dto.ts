import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateDesSongPostDto {

  @IsString()
  @IsNotEmpty()
  songName: string;

  @IsString()
  @IsNotEmpty()
  albumImage: string;

  @IsString()
  @IsNotEmpty()
  artists: string;

  @IsString()
  @IsNotEmpty()
  trackid: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString({ each: true })
  @IsOptional()
  topic: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}


