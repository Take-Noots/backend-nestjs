import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdvertisementDTO {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsString()
  contactDetails?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  hashtags?: string;

  @IsOptional()
  @IsString()
  keywords?: string;
}
