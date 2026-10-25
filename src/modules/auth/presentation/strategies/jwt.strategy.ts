import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '../../../users/infrastructure/persistence/typeorm/user.orm-entity.js';
import type { AuthenticatedUser } from '../../../../shared/auth/interfaces/authenticated-user.interface.js';

interface JwtPayload { sub: number; }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!Number.isInteger(payload.sub) || payload.sub <= 0) {
      throw new UnauthorizedException('Invalid access token');
    }
    const user = await this.users.findOne({
      where: { id: payload.sub },
      relations: { role: { permissions: true } },
    });
    if (!user) throw new UnauthorizedException('User no longer exists');

    return {
      id: user.id,
      email: user.email,
      role: user.role?.code ?? null,
      permissions: [...new Set((user.role?.permissions ?? []).map((p) => p.code))],
    };
  }
}
