import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity.js';
import { RoleEntity } from '../roles/role.entity.js';
import { PermissionEntity } from '../permissions/permission.entity.js';
import { RefreshTokenEntity } from './refresh-token.entity.js';
import { LoginService } from './login.service.js';
import { RefreshTokenService } from './refresh-token.service.js';
import { LogoutService } from './logout.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      PermissionEntity,
      RefreshTokenEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_EXPIRES_IN',
            '15m',
          ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [LoginService, RefreshTokenService, LogoutService, JwtStrategy],
  exports: [JwtModule, PassportModule, RefreshTokenService],
})
export class AuthModule {}
