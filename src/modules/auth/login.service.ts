import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity.js';
import { RefreshTokenService } from './refresh-token.service.js';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async execute(email: string, password: string) {
    console.log('GG');
    try {
      const user = await this.users.findOne({
        where: { email: email.trim().toLowerCase() },
        relations: { role: { permissions: true } },
        select: { id: true, name: true, email: true, passwordHash: true },
      });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const accessToken = await this.jwt.signAsync({ sub: user.id });
      const refreshToken = await this.refreshTokens.issue(user.id);
      const permissions = [
        ...new Set((user.role?.permissions ?? []).map((p) => p.code)),
      ];

      return {
        accessToken,
        refreshToken,
        tokenType: 'Bearer' as const,
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.code ?? null,
          permissions,
        },
      };
    } catch (err) {
      console.log('aldaa ', err);
    }

    return null;
  }
}
