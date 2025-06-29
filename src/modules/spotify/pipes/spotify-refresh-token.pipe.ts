import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SpotifyRefreshTokenPipe implements PipeTransform {
    transform(value: any): string {

        if (!value) {
            throw new BadRequestException('Refresh token not found in cookies');
        }
        
        return value.trim();
    }
}