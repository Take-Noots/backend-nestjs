import { PipeTransform, Injectable, ArgumentMetadata, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtRefreshUserPipe implements PipeTransform<any, string> {
  transform(value: any, metadata: ArgumentMetadata): string {
    const request: Request = value;
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token cookie found');
    }

    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as any;

      if (!payload.sub) {
        throw new UnauthorizedException('User ID not found in refresh token');
      }

      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}