import { Injectable } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service.js';

@Injectable()
export class LogoutService {
  constructor(private readonly refreshTokens: RefreshTokenService) {}

  async execute(userId: number, refreshToken: string): Promise<void> {
    await this.refreshTokens.revoke(userId, refreshToken);
  }
}
