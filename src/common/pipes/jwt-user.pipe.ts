import { PipeTransform, Injectable, ArgumentMetadata, UnauthorizedException } from '@nestjs/common';

export interface JwtUser {
  userId: string;
  role: string;
}

@Injectable()
export class JwtUserPipe implements PipeTransform<any, JwtUser> {
  transform(value: any, metadata: ArgumentMetadata): JwtUser {
    // The value is the request object which should have the user property 
    // attached by the JwtAuthGuard
    if (!value || !value.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const { userId, role } = value.user;
    
    if (!userId) {
      throw new UnauthorizedException('User ID not found in JWT');
    }

    return { userId, role };
  }
}
