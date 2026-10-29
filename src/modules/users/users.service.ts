import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserStatus } from './user-status.enum.js';
import { UserEntity } from './user.entity.js';

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

  async update(id: number, dto: UpdateUserDto, actor: string) {
    const user = await this.findOne(id);

    if (dto.firstname !== undefined) user.firstname = dto.firstname.trim();
    if (dto.lastname !== undefined) user.lastname = dto.lastname.trim();
    if (dto.email !== undefined) user.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) user.phone = dto.phone.trim();
    if (dto.status !== undefined) user.status = dto.status;
    user.updated_user = actor;

    try {
      return await this.users.save(user);
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
