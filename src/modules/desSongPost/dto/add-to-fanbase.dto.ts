import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class AddPostToFanbaseDto {

    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    postId: string;

    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    fanbaseId: string;
}