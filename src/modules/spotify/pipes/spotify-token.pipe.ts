import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class SpotifyTokenPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) {
      throw new BadRequestException('x-spotify-token header is required');
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('x-spotify-token must be a string');
    }

    if (value.trim().length === 0) {
      throw new BadRequestException('x-spotify-token cannot be empty');
    }

    return value.trim();
  }
}