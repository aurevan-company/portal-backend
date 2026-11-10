import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '../../modules/organizations/organization.entity.js';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

interface OrganizationRequest {
  user?: AuthenticatedUser;
  headers: Record<string, string | string[] | undefined>;
  organization_id?: number;
}

// The token carries no organization, so the frontend sends the active one in
// the `x-organization-id` header. Never trust that id on its own: this guard
// verifies the token user owns it (organizations.owner_id = user.id).
// Use after JwtAuthGuard. The consuming module must register
// TypeOrmModule.forFeature([OrganizationEntity]).
@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizations: Repository<OrganizationEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrganizationRequest>();
    const user = request.user;
    if (!user) throw new UnauthorizedException('Authentication required');

    const raw = request.headers['x-organization-id'];
    const id = typeof raw === 'string' ? Number(raw) : NaN;
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(
        'x-organization-id header must be a positive integer',
      );
    }

    const organization = await this.organizations.findOne({
      where: { id, owner_id: user.id, deleted: false, is_active: true },
      select: { id: true },
    });
    if (!organization) {
      throw new ForbiddenException('No access to this organization');
    }

    request.organization_id = id;
    return true;
  }
}
