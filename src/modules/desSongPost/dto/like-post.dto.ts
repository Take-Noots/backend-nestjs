import { IsString, IsNotEmpty } from 'class-validator';

export class LikePostDto {

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    postId: string;
}