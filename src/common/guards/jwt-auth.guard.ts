import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import 'dotenv/config';

interface JwtPayload {
  sub: string;
  exp: number;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No JWT token provided');
    }
    
    try {
      // Verify and decode the JWT token
      const payload = jwt.verify(
        token, 
        process.env.ACCESS_TOKEN_SECRET as string
      ) as JwtPayload;
      
      // Check if token has expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        throw new UnauthorizedException('JWT token has expired');
      }
      
      // Attach user info to request object for use in controllers and other guards
      request['user'] = {
        userId: payload.sub,
        role: payload.role
      };
      
      return true;
    } catch (error) {
      // Handle different JWT verification errors
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('JWT token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid JWT token');
      } else {
        throw new UnauthorizedException('JWT validation failed');
      }
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }
    
    const [type, token] = authHeader.split(' ');
    
    return type === 'Bearer' ? token : undefined;
  }
}
