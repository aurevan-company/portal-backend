import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { CreateUserDto } from '../dto/create-user.dto.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { UserQueryDto } from '../dto/list-users-query.dto.js';
import { UserResponseDto } from '../dto/user-response.dto.js';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';

import { CreateUserService } from '../../application/services/create-user.service.js';
import { GetUserService } from '../../application/services/get-user.service.js';
import { ListUsersService } from '../../application/services/list-users.service.js';
import { UpdateUserService } from '../../application/services/update-user.service.js';
import { DeleteUserService } from '../../application/services/delete-user.service.js';
import { JwtAuthGuard } from '../../../../shared/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../../shared/auth/guards/permissions.guard.js';
import { RequirePermissions } from '../../../../shared/auth/decorators/require-permissions.decorator.js';

@Controller('user')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserService,
    private readonly getUser: GetUserService,
    private readonly listUsers: ListUsersService,
    private readonly updateUser: UpdateUserService,
    private readonly deleteUser: DeleteUserService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.create')
  async create(@Body() dto: CreateUserDto) {
    console.log('body ', dto);
    const user = await this.createUser.execute(dto);

    return UserResponseDto.fromDomain(user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.read')
  async findAll(@Query() query: UserQueryDto) {
    const users = await this.listUsers.execute(query.page, query.limit);

    // return users.map(UserResponseDto.fromDomain);
    return {
      items: users.items.map(UserResponseDto.fromDomain),
      meta: users.meta,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.getUser.execute(id);

    return UserResponseDto.fromDomain(user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.updateUser.execute(id, dto);

    return UserResponseDto.fromDomain(user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteUser.execute(id);
  }
}
