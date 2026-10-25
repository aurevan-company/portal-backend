import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { User } from '../../../domain/entities/user.js';
import type { UsersRepository } from '../../../domain/repositories/user.repository.js';
import { UserMapper } from '../mappers/user.mapper.js';
import { UserOrmEntity } from './user.orm-entity.js';

@Injectable()
export class TypeOrmUsersRepository implements UsersRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    roleId?: number;
  }): Promise<User> {
    const entity = this.repository.create({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.roleId
        ? ({ id: input.roleId } as UserOrmEntity['role'])
        : null,
    });

    const saved = await this.repository.save(entity);

    return UserMapper.toDomain(saved);
  }

  async findById(id: number): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findMany(skip: number, take: number): Promise<User[]> {
    const entities = await this.repository.find({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return entities.map(UserMapper.toDomain);
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async update(
    id: number,
    changes: Partial<Pick<User, 'name' | 'email' | 'passwordHash'>>,
  ): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    Object.assign(entity, changes);

    const saved = await this.repository.save(entity);

    return UserMapper.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
