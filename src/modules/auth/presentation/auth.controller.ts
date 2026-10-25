import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LoginService } from '../application/login.service.js';
import { RefreshTokenService } from '../application/refresh-token.service.js';
import { LogoutService } from '../application/logout.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../shared/auth/interfaces/authenticated-user.interface.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    console.log('hello');
    return this.loginService.execute(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokens.rotate(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
  ) {
    await this.logoutService.execute(user.id, dto.refreshToken);
    return { message: 'Logged out successfully' };
  }
}
