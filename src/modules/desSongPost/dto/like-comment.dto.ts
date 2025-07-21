import { IsString, IsNotEmpty } from 'class-validator';

export class LikeCommentDto {

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    postId: string;
    
    @IsString()
    @IsNotEmpty()
    commentId: string;
}