import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';

import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { RefreshTokenEntity } from '../auth/refresh-token.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserStatus } from './user-status.enum.js';
import { UserEntity } from './user.entity.js';

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

const isUniqueViolation = (error: unknown) =>
  !!error &&
  typeof error === 'object' &&
  'code' in error &&
  error.code === '23505';

const duplicateMessage = (error: unknown) => {
  const detail =
    error && typeof error === 'object' && 'detail' in error
      ? String(error.detail)
      : '';
  if (detail.includes('(email)')) return 'Email is already registered';
  return 'Email is already registered';
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokens: Repository<RefreshTokenEntity>,
  ) {}

  async create(dto: CreateUserDto) {
    const entity = this.users.create({
      firstname: dto.firstname.trim(),
      lastname: dto.lastname.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() ?? null,
      status: dto.status ?? UserStatus.ACTIVE,
      password_hash: await bcrypt.hash(dto.password, 12),
      role: dto.role_id ? ({ id: dto.role_id } as UserEntity['role']) : null,
    });

    try {
      const { password_hash: _omit, ...saved } = await this.users.save(entity);
      return saved;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(duplicateMessage(error));
      }
      throw error;
    }
  }

  async findAll(page = 1, limit = 20) {
    const [items, total] = await this.users.findAndCount({
      where: { deleted: false },
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next_page: page * limit < total,
        has_previous_page: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.users.findOne({ where: { id, deleted: false } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: UpdateUserDto, actor: AuthenticatedUser) {
    // Only SUPER_ADMIN may set a password here; users change their own via
    // POST /auth/change-password.
    if (dto.new_password !== undefined && actor.role !== SUPER_ADMIN_ROLE) {
      throw new ForbiddenException('Only SUPER_ADMIN can change passwords');
    }

    const user = await this.findOne(id);

    if (dto.firstname !== undefined) user.firstname = dto.firstname.trim();
    if (dto.lastname !== undefined) user.lastname = dto.lastname.trim();
    if (dto.email !== undefined) user.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) user.phone = dto.phone.trim();
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.new_password !== undefined) {
      user.password_hash = await bcrypt.hash(dto.new_password, 12);
    }
    user.updated_user = actor.email;

    try {
      const saved = await this.users.save(user);
      if (dto.new_password !== undefined) {
        // Force the user to log in again with the new password.
        await this.refreshTokens.update(
          { userId: id, revokedAt: IsNull() },
          { revokedAt: new Date() },
        );
      }
      return saved;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(duplicateMessage(error));
      }
      throw error;
    }
  }

  async remove(id: number, actor: string) {
    await this.findOne(id);
    await this.users.update(id, { deleted: true, updated_user: actor });
  }
}
