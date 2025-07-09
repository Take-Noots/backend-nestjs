// src/modules/admin/guards/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../../user/user.service';
import 'dotenv/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private userService: UserService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateRequest(context);
  }

  private async validateRequest(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Check for Authorization header
    const authHeader = request.headers.authorization;
    let token: string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Check for token in cookies (from your existing auth system)
      token = request.cookies?.access_token;
    }

    if (!token) {
      throw new UnauthorizedException('No authorization token provided');
    }

    try {
      // Verify token using your existing secret
      const secret = process.env.ACCESS_TOKEN_SECRET;
      if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
      }
      const decoded = jwt.verify(token, secret) as any;
      const user = await this.userService.findById(decoded.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is admin or moderator
      if (user.role !== 'admin' && user.role !== 'moderator') {
        throw new ForbiddenException('Insufficient permissions. Admin or Moderator access required.');
      }

      // Check if user is banned
      if (user.isBlocked) {
        throw new ForbiddenException('User account is blocked');
      }

      // Add user to request for use in controllers
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}