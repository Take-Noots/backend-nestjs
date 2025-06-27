import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { SKIP_AUTH_KEY } from '../decorators/spotify-skip-auth.decorator';

@Injectable()
export class SpotifyTokenGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(ctx: ExecutionContext): boolean {
        const skipAuth = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        
        if (skipAuth) {
            return true;
        }
        

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