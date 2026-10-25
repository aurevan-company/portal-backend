import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/user.repository.js';

@Injectable()
export class UpdateUserService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepository,
  ) {}

  async execute(id: number, input: { name?: string; email?: string }) {
    const existing = await this.users.findById(id);

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const changes: { name?: string; email?: string } = {};

    if (input.name !== undefined) {
      changes.name = input.name.trim();
    }

    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();

      if (email !== existing.email) {
        const emailOwner = await this.users.findByEmail(email);

        if (emailOwner && emailOwner.id !== id) {
          throw new ConflictException('Email is already registered');
        }
      }

      changes.email = email;
    }

    try {
      const updated = await this.users.update(id, changes);

      if (!updated) {
        throw new NotFoundException('User not found');
      }

      return updated;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }
}
