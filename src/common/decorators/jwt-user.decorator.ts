import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserData {
  userId: string;
  role: string;
}

export const JwtUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
