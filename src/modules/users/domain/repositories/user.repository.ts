import type { User } from '../entities/user.js';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersRepository {
  create(input: {
    name: string;
    email: string;
    passwordHash: string;
    roleId?: number;
  }): Promise<User>;

  findById(id: number): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  findMany(skip: number, take: number): Promise<User[]>;

  count(): Promise<number>;

  update(
    id: number,
    changes: Partial<Pick<User, 'name' | 'email' | 'passwordHash'>>,
  ): Promise<User | null>;

  delete(id: number): Promise<void>;
}
