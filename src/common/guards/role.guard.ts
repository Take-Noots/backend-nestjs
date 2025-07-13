import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // Check if user object exists (JWT Guard should have created it)
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }
    
    // Check if the user's role matches any of the required roles
    // Note: JWT Guard sets user.role (singular), not user.roles (plural)
    const hasRequiredRole = requiredRoles.some(role => role === user.role);
    
    if (!hasRequiredRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return true;
  }
}
