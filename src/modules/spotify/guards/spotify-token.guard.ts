import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SpotifyTokenGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
    const request: Request = ctx.switchToHttp().getRequest();
    const spotifyToken = request.headers['x-spotify-token'];

    if (!spotifyToken) {
      throw new BadRequestException('x-spotify-token header is required');
    }

    if (typeof spotifyToken !== 'string') {
      throw new BadRequestException('x-spotify-token must be a string');
    }

    return true;
  }
}