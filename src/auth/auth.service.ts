import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { LoginAuthDto } from './dto/request/login-auth.dto.js';

import { RegisterAuthDto } from './dto/request/register-auth.dto.js';
import { LoginResponseDto } from './dto/response/login-response.dto.js';
import { ProfileResponseDto } from './dto/response/profile-response.dto.js';
import { LoginMappers } from './mappers/login.mapper.js';
import { ProfileMappers } from './mappers/profile-mappers.js';
import { TokenService } from './services/token.service.js';
import { ResponseHelper } from '../common/response/response.helper.js';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tokenService: TokenService,
  ) {}

  async register(registerAuthDto: RegisterAuthDto): Promise<ResponseHelper<void>> {
    const { fullName, email, password } = registerAuthDto;

    const existingUser = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (existingUser) throw new ConflictException('El correo electrónico ya está registrado');

    const clientRole = await this.databaseService.role.findUnique({
      where: { code: 'CLIENT' },
    });

    if (!clientRole) throw new NotFoundException('El rol CLIENT no existe en la base de datos');

    const passwordHash = await argon2.hash(password);

    const user = await this.databaseService.user.create({
      data: {
        email,
        full_name: fullName,
        password_hash: passwordHash,
        user_type: 'CUSTOMER',
        role_id: clientRole.id,
        status: 'ACTIVE',
      },
    });

    await this.databaseService.auth_audit_log.create({
      data: {
        user_id: user.id,
        action: 'REGISTER',
        payload: {
          role: clientRole.code,
        },
      },
    });

    return new ResponseHelper('Usuario registrado correctamente');
  }

  async login(
    loginAuthDto: LoginAuthDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponseDto> {
    const { email, password } = loginAuthDto;

    const user = await this.databaseService.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user?.password_hash) throw new UnauthorizedException('Credenciales inválidas');

    if (user.status !== 'ACTIVE') throw new UnauthorizedException('El usuario no está activo');

    if (!user.role) throw new UnauthorizedException('El usuario no tiene un rol asignado');

    const isPasswordValid = await argon2.verify(user.password_hash, password);

    if (!isPasswordValid) {
      await this.databaseService.auth_audit_log.create({
        data: {
          user_id: user.id,
          action: 'LOGIN_FAILED',
          payload: {
            reason: 'INVALID_PASSWORD',
          },
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      });

      throw new UnauthorizedException('Credenciales inválidas');
    }

    const session = await this.databaseService.session.create({
      data: {
        user_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        refreshed_at: new Date(),
      },
    });

    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.role.code,
      session.id,
    );

    const refreshToken = await this.tokenService.generateRefreshToken(user.id, session.id);

    await this.databaseService.refresh_token.create({
      data: {
        user_id: user.id,
        session_id: session.id,
        token_hash: await argon2.hash(refreshToken),
      },
    });

    await this.databaseService.user.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        failed_login_attempts: 0,
        locked_until: null,
      },
    });

    await this.databaseService.auth_audit_log.create({
      data: {
        user_id: user.id,
        action: 'LOGIN_SUCCESS',
        payload: {
          role: user.role.code,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    return LoginMappers.toResponse(accessToken, refreshToken, user);
  }

  async refresh(userId: string, sessionId: string, refreshToken: string) {
    const user = await this.databaseService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        role: true,
      },
    });

    console.log(user);

    if (!user) throw new UnauthorizedException('Sesión no válida');

    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Usuario inactivo');

    if (!user.role) throw new UnauthorizedException('El usuario no tiene un rol asignado');

    const session = await this.databaseService.session.findFirst({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) throw new UnauthorizedException('Sesión no válida');

    if (session.not_after && session.not_after < new Date())
      throw new UnauthorizedException('La sesión ha expirado');

    const refreshTokens = await this.databaseService.refresh_token.findMany({
      where: {
        session_id: sessionId,
        user_id: userId,
        revoked: false,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    let storedToken: (typeof refreshTokens)[number] | undefined;

    for (const token of refreshTokens) {
      const matches = await argon2.verify(token.token_hash, refreshToken);

      if (matches) {
        storedToken = token;
        break;
      }
    }

    if (!storedToken) throw new UnauthorizedException('Refresh token inválido');

    await this.databaseService.refresh_token.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revoked: true,
      },
    });

    const newAccessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.role.code,
      session.id,
    );

    const newRefreshToken = await this.tokenService.generateRefreshToken(user.id, session.id);

    const newRefreshTokenHash = await argon2.hash(newRefreshToken);

    await this.databaseService.refresh_token.create({
      data: {
        user_id: user.id,
        session_id: session.id,
        token_hash: newRefreshTokenHash,
        parent: storedToken.id,
      },
    });

    await this.databaseService.session.update({
      where: {
        id: session.id,
      },
      data: {
        refreshed_at: new Date(),
      },
    });

    await this.databaseService.auth_audit_log.create({
      data: {
        user_id: user.id,
        action: 'TOKEN_REFRESH',
        payload: {},
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.databaseService.refresh_token.updateMany({
      where: {
        user_id: userId,
        session_id: sessionId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    await this.databaseService.session.update({
      where: {
        id: sessionId,
      },
      data: {
        not_after: new Date(),
      },
    });

    await this.databaseService.auth_audit_log.create({
      data: {
        user_id: userId,
        action: 'LOGOUT',
        payload: {},
      },
    });

    return {
      message: 'Sesión cerrada correctamente',
    };
  }

  async getProfile(id: string): Promise<ResponseHelper<ProfileResponseDto>> {
    const user = await this.databaseService.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const profile = ProfileMappers.toResponse(user);

    return new ResponseHelper('Perfil obtenido correctamente', profile);
  }
}
