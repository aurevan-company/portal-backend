import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity.js';
import { RefreshTokenEntity } from './refresh-token.entity.js';

@Injectable()
export class ChangePasswordService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokens: Repository<RefreshTokenEntity>,
  ) {}

  async execute(
    user_id: number,
    email: string,
    current_password: string,
    new_password: string,
  ): Promise<void> {
    const user = await this.users.findOne({
      where: { id: user_id, deleted: false },
      select: { id: true, password_hash: true },
    });

    if (!user || !(await bcrypt.compare(current_password, user.password_hash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (current_password === new_password) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    await this.users.update(user_id, {
      password_hash: await bcrypt.hash(new_password, 12),
      updated_user: email,
    });

    // Sign out every session; the user logs in again with the new password.
    await this.refreshTokens.update(
      { userId: user_id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
