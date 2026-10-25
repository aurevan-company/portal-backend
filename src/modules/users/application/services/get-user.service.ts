import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/user.repository.js';

@Injectable()
export class GetUserService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepository,
  ) {}

  async execute(id: number) {
    const user = await this.users.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
