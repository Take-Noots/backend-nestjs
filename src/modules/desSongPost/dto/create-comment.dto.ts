import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AddDesCommentDto {

  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}


