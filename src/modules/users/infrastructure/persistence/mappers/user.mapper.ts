import type { User } from '../../../domain/entities/user.js';
import { UserOrmEntity } from '../../persistence/typeorm/user.orm-entity.js';

export class UserMapper {
  static toDomain(entity: UserOrmEntity): User {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      passwordHash: entity.passwordHash,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
