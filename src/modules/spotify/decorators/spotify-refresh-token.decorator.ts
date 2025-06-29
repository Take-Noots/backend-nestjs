import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SpotifyRefreshToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.cookies['spotify_refresh_token'];
  },
);