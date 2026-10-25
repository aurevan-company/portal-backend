import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/user.repository.js';

@Injectable()
export class DeleteUserService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const user = await this.users.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.users.delete(id);
  }
}
