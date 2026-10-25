import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import type { SignOptions } from 'jsonwebtoken';
import { Repository, IsNull } from 'typeorm';

import { RefreshTokenOrmEntity } from '../infrastructure/refresh-token.orm-entity.js';

interface RefreshPayload {
  sub: number;
  type: 'refresh';
}

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly tokens: Repository<RefreshTokenOrmEntity>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private get refreshSecret(): string {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  private get refreshExpiresIn(): string {
    return this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  private expirationDate(): Date {
    const value = this.refreshExpiresIn;
    const match = /^(\d+)([smhd])$/.exec(value);

    if (!match) {
      throw new Error('JWT_REFRESH_EXPIRES_IN must look like 15m, 12h, or 7d');
    }

    const amount = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return new Date(Date.now() + amount * multipliers[unit]);
  }

  async issue(userId: number): Promise<string> {
    const expiresAt = this.expirationDate();

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, type: 'refresh' },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn as SignOptions['expiresIn'],
      },
    );

    await this.tokens.save(
      this.tokens.create({
        userId,
        tokenHash: this.hash(refreshToken),
        expiresAt,
        revokedAt: null,
      }),
    );

    return refreshToken;
  }

  async rotate(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: string;
  }> {
    let payload: RefreshPayload;

    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      payload.type !== 'refresh' ||
      !Number.isInteger(payload.sub) ||
      payload.sub <= 0
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hash(refreshToken);

    const savedToken = await this.tokens.findOne({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: IsNull(),
      },
    });

    if (!savedToken || savedToken.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Нэг refresh token-ийг дахин ашиглахаас сэргийлнэ.
    savedToken.revokedAt = new Date();
    await this.tokens.save(savedToken);

    const accessExpiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');

    const accessToken = await this.jwt.signAsync({
      sub: payload.sub,
    });

    const newRefreshToken = await this.issue(payload.sub);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresIn,
    };
  }

  async revoke(userId: number, refreshToken: string): Promise<void> {
    const tokenHash = this.hash(refreshToken);

    const token = await this.tokens.findOne({
      where: {
        userId,
        tokenHash,
        revokedAt: IsNull(),
      },
    });

    if (token) {
      token.revokedAt = new Date();
      await this.tokens.save(token);
    }
  }
}
