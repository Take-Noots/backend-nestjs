import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserType } from '../interfaces/user.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserType => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);