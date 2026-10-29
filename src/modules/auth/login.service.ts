import {
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserStatus } from '../users/user-status.enum.js';
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
        where: { email: email.trim().toLowerCase(), deleted: false },
        relations: { role: { permissions: true } },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          status: true,
          password_hash: true,
        },
      });

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (user.status === UserStatus.INACTIVE) {
        throw new ForbiddenException('Your account is inactive');
      }
      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException('Your account is suspended');
      }

      const accessToken = await this.jwt.signAsync({ sub: user.id });
      const refreshToken = await this.refreshTokens.issue(user.id);
      const permissions = [
        ...new Set((user.role?.permissions ?? []).map((p) => p.code)),
      ];

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer' as const,
        expires_in: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role?.code ?? null,
          permissions,
        },
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      console.log('aldaa ', err);
    }

    return null;
  }
}
