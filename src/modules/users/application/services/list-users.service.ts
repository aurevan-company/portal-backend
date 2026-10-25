// import { Inject, Injectable } from '@nestjs/common';

// import {
//   USERS_REPOSITORY,
//   type UsersRepository,
// } from '../../domain/repositories/user.repository.js';

// @Injectable()
// export class ListUsersService {
//   constructor(
//     @Inject(USERS_REPOSITORY)
//     private readonly users: UsersRepository,
//   ) {}

//   async execute(page = 1, limit = 20) {
//     return this.users.findMany((page - 1) * limit, limit);
//   }
// }

import { Inject, Injectable } from '@nestjs/common';

import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/user.repository.js';

@Injectable()
export class ListUsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly users: UsersRepository,
  ) {}

  async execute(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.users.findMany(skip, limit),
      this.users.count(),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}
