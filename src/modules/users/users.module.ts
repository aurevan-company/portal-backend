import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOrmEntity } from './infrastructure/persistence/typeorm/user.orm-entity.js';
import { TypeOrmUsersRepository } from './infrastructure/persistence/typeorm/user.repository.impl.js';
import { USERS_REPOSITORY } from './domain/repositories/user.repository.js';

import { UsersController } from './api/controllers/users.controller.js';

import { CreateUserService } from './application/services/create-user.service.js';
import { GetUserService } from './application/services/get-user.service.js';
import { ListUsersService } from './application/services/list-users.service.js';
import { UpdateUserService } from './application/services/update-user.service.js';
import { DeleteUserService } from './application/services/delete-user.service.js';
import { JwtAuthGuard } from '../../shared/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../shared/auth/guards/permissions.guard.js';

const USER_SERVICES = [
  CreateUserService,
  GetUserService,
  ListUsersService,
  UpdateUserService,
  DeleteUserService,
];
@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [
    ...USER_SERVICES,
    JwtAuthGuard,
    PermissionsGuard,
    {
      provide: USERS_REPOSITORY,
      useClass: TypeOrmUsersRepository,
    },
  ],
  exports: [...USER_SERVICES],
})
export class UsersModule {}
