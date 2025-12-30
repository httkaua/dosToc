import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./role.decorator";
import { Role } from "./role.enum";
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private reflector: Reflector
  ) {}
  canActivate(context: ExecutionContext): boolean {
    if (this.logger.debug) {
        this.logger.debug(`Access validation: ${context.switchToHttp().getRequest().user.email}`, 'RBAC Guard')
    }
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      this.logger.log('No roles required for this route, access granted.', 'RBAC Guard')
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || user.role === undefined || user.role === null) {
      this.logger.warn('User role not found, access denied.', 'RBAC Guard')
      return false;
    }
    
    const hasRole = requiredRoles.includes(user.role);

    if (hasRole) {
      this.logger.log(`Access granted.`, 'RBAC Guard')
    } else {
      this.logger.warn(`User role '${ROLES_KEY[user.role]}' does not match required roles, access denied.`, 'RBAC Guard')
    }

    return hasRole;
  }
}
