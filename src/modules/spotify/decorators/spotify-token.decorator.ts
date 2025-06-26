import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const SpotifyToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.headers['x-spotify-token'] as string;
  },
);