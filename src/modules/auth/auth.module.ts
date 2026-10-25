import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '../users/infrastructure/persistence/typeorm/user.orm-entity.js';
import { RoleOrmEntity } from '../roles/infrastructure/role.orm-entity.js';
import { PermissionOrmEntity } from '../permissions/infrastructure/permission.orm-entity.js';
import { RefreshTokenOrmEntity } from './infrastructure/refresh-token.orm-entity.js';
import { LoginService } from './application/login.service.js';
import { RefreshTokenService } from './application/refresh-token.service.js';
import { LogoutService } from './application/logout.service.js';
import { AuthController } from './presentation/auth.controller.js';
import { JwtStrategy } from './presentation/strategies/jwt.strategy.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserOrmEntity, RoleOrmEntity, PermissionOrmEntity, RefreshTokenOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') as `${number}${'s' | 'm' | 'h' | 'd'}` },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [LoginService, RefreshTokenService, LogoutService, JwtStrategy],
  exports: [JwtModule, PassportModule, RefreshTokenService],
})
export class AuthModule {}
