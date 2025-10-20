// src/modules/admin/guards/admin.guard.ts
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException, 
  UnauthorizedException 
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
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
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    try {
      // Check for Authorization header first, then cookies
      const authHeader = request.headers.authorization;
      let token: string | undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔑 Found Bearer token');
      } else {
        // Check for token in cookies (prioritize access_token over refresh token)
        token = request.cookies?.access_token || request.cookies?.admin_refresh_token;
        if (token) {
          console.log('🍪 Found token in cookies');
        }
      }

      if (!token) {
        console.log('❌ No token found in request');
        console.log('📋 Available cookies:', Object.keys(request.cookies || {}));
        this.handleUnauthorized(request, response);
        return false;
      }

      // Verify token using your existing secret
      const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
      if (!secret) {
        console.error('❌ JWT secret not configured');
        throw new Error('JWT secret is not defined');
      }

      console.log('🔍 Verifying token with secret length:', secret.length);
      const decoded = jwt.verify(token, secret) as any;

      // Check if token is close to expiring (within 5 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;

      console.log('✅ Token decoded successfully:', {
        sub: decoded.sub,
        exp: decoded.exp,
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60)} minutes`,
        role: decoded.role
      });

      // Log warning if token expires soon
      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log('⚠️  Token expires soon! Time left:', Math.floor(timeUntilExpiry / 60), 'minutes');
      }

      // More detailed user lookup
      console.log('👤 Looking up user with ID:', decoded.sub);
      const user = await this.userService.findById(decoded.sub);

      if (!user) {
        console.log('❌ User not found in database for ID:', decoded.sub);
        
        // Try to find by email if JWT has email
        if (decoded.email) {
          console.log('🔍 Trying to find by email:', decoded.email);
          const userByEmail = await this.userService.findByEmail(decoded.email);
          if (userByEmail) {
            console.log('✅ Found user by email:', userByEmail.email);
            // Update the user reference
            request['user'] = userByEmail;
            return this.checkUserPermissions(userByEmail, request, response);
          }
        }
        
        this.handleUnauthorized(request, response);
        return false;
      }

      return this.checkUserPermissions(user, request, response);

    } catch (error) {
      console.error('❌ Admin guard error:', error.message);
      
      if (error instanceof jwt.JsonWebTokenError) {
        console.log('❌ Invalid JWT token:', error.message);
        this.handleUnauthorized(request, response);
        return false;
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        console.log('❌ JWT token expired:', error.message);
        this.handleUnauthorized(request, response);
        return false;
      }

      // For API requests, throw exception
      if (this.isApiRequest(request)) {
        if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
          throw error;
        }
        throw new UnauthorizedException('Invalid or expired token');
      }

      // For web requests, redirect to login
      this.handleUnauthorized(request, response);
      return false;
    }
  }

  private checkUserPermissions(user: any, request: Request, response: Response): boolean {
    console.log('👤 User found:', { 
      id: user._id, 
      email: user.email, 
      role: user.role,
      isBlocked: user.isBlocked 
    });

    // Check if user is admin or moderator
    if (user.role !== 'admin' && user.role !== 'moderator') {
      console.log('❌ Insufficient permissions:', user.role);
      this.handleForbidden(request, response, 'Admin or Moderator access required');
      return false;
    }

    // Check if user is banned
    if (user.isBlocked) {
      console.log('❌ User account is blocked');
      this.handleForbidden(request, response, 'Account is blocked');
      return false;
    }

    console.log('✅ Admin access granted for:', user.email);
    
    // Add user to request for use in controllers
    request['user'] = user;
    return true;
  }

  private isApiRequest(request: Request): boolean {
    return request.path?.startsWith('/admin/api') || 
           request.headers.accept?.includes('application/json') ||
           request.headers['content-type']?.includes('application/json') ||
           false;
  }

  private isWebRequest(request: Request): boolean {
    const acceptHeader = request.headers.accept || '';
    return acceptHeader.includes('text/html') || 
           (!acceptHeader.includes('application/json') && !request.path.startsWith('/admin/api'));
  }

  private handleUnauthorized(request: Request, response: Response): void {
    console.log('🚫 Unauthorized access attempt:', {
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      cookies: Object.keys(request.cookies || {}),
      ip: request.ip
    });

    if (this.isWebRequest(request)) {
      console.log('🔄 Redirecting to login page');
      // Clear invalid cookies with proper options
      response.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      response.clearCookie('admin_refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // Redirect to login page
      response.redirect('/admin/login');
    } else {
      throw new UnauthorizedException('Authentication required');
    }
  }

  private handleForbidden(request: Request, response: Response, message: string): void {
    if (this.isWebRequest(request)) {
      console.log('🚫 Rendering error on login page');
      // For web requests, render error page or redirect
      response.status(403).render('admin/login', {
        title: 'Admin Login',
        error: message
      });
    } else {
      throw new ForbiddenException(message);
    }
  }
}