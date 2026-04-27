import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserProfileRepository } from '@batch-cooking/domain-services';
import { UserRole } from '@batch-cooking/domain';
import { ICustomRequest } from '../../shared/interfaces/request.interface';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) return true;

    const req = context.switchToHttp().getRequest<ICustomRequest>();
    const profile = await this.userProfileRepository.findById(req.user.id);

    if (!profile) throw new ForbiddenException('User profile not found');

    // ADMIN inherits all STAFF permissions
    const effectiveRoles =
      profile.role === UserRole.ADMIN
        ? [UserRole.ADMIN, UserRole.STAFF]
        : [profile.role as UserRole];

    if (!requiredRoles.some((r) => effectiveRoles.includes(r))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    req.user.role = profile.role as UserRole;
    return true;
  }
}
