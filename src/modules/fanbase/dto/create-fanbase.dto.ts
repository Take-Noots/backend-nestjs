import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFanbaseDto {
  @IsNotEmpty()
  @IsString()
  fanbaseName: string;

  @IsNotEmpty()
  @IsString()
  topic: string;

  @IsNotEmpty()
  @IsString()
  createdUserId: string;

  @IsNotEmpty()
  @IsString()
  fanbasePhotoUrl: string;
}
