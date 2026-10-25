import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/user.repository.js';

@Injectable()
export class CreateUserService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepository,
  ) {}

  async execute(input: {
    name: string;
    email: string;
    password: string;
    roleId?: number;
  }) {
    const email = input.email.trim().toLowerCase();
    console.log('email ', email);
    try {
      const existing = await this.users.findByEmail(email);
    } catch (err) {
      console.log('err ', err);
    }
    // console.log('exists ', existing);
    // if (existing) {
    //   throw new ConflictException('Email is already registered');
    // }

    const passwordHash = await bcrypt.hash(input.password, 12);

    try {
      return await this.users.create({
        name: input.name.trim(),
        email,
        passwordHash,
        roleId: input.roleId,
      });
    } catch (error) {
      // Давхар хүсэлт зэрэг ирэхэд DB unique constraint хамгаална.
      console.log('err ', error);
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
