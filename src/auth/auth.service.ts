import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: any) {
    console.log('validateGoogleUser: ', profile);
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;

    let user = await this.prisma.user.findUnique({
      where: {
        provider_provider_id: {
          provider: 'google',
          provider_id: id,
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: displayName,
          provider: 'google',
          provider_id: id,
        },
      });
    }

    return user;
  }

  async findUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async generateJwtToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async generateTokens(user: any, deviceInfo: any) {
    const payload = { email: user.email, sub: user.id };

    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    // JWT 다중세션: 반드시 deviceInfo와 함께 저장
    await this.saveRefreshTokenWithDevice(user.id, refresh_token, deviceInfo);

    return {
      access_token,
      refresh_token,
    };
  }


  // 기존 단일 토큰 방식 (deprecated) - 호환성 유지용
  async refreshAccessToken(refreshToken: string) {
    throw new Error('This method is deprecated. Use refreshAccessTokenForDevice instead.');
  }

  // 기존 단일 토큰 방식 (deprecated) - 호환성 유지용
  async removeRefreshToken(refreshToken: string) {
    // JWT 다중세션에서는 removeCurrentDeviceSession 사용
    return this.removeCurrentDeviceSession(refreshToken);
  }

  async removeCurrentDeviceSession(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      // 해당 refresh token으로 활성 세션 찾기
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          user_id: payload.sub,
          is_active: true,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      // 현재 토큰과 매칭되는 세션 찾아서 비활성화
      for (const token of storedTokens) {
        const isCurrentToken = await bcrypt.compare(refreshToken, token.token_hash);
        if (isCurrentToken) {
          await this.prisma.refreshToken.update({
            where: { id: token.id },
            data: { is_active: false },
          });
          break;
        }
      }
    } catch {
      // 토큰이 유효하지 않아도 무시 (이미 로그아웃 상태)
    }
  }

  // JWT 다중세션 관리 메서드들
  private generateDeviceId(userAgent?: string, ip?: string): string {
    return crypto.randomUUID();
  }

  private extractDeviceInfo(req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';

    let deviceType = 'unknown';
    if (userAgent.includes('Mobile')) deviceType = 'mobile';
    else if (userAgent.includes('Tablet')) deviceType = 'tablet';
    else deviceType = 'desktop';

    return {
      userAgent,
      ip,
      deviceType,
      deviceName: this.getDeviceName(userAgent),
    };
  }

  private getDeviceName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    return 'Unknown Device';
  }

  async saveRefreshTokenWithDevice(
    userId: number,
    refreshToken: string,
    deviceInfo: any,
  ) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const deviceId = deviceInfo.deviceId || this.generateDeviceId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일

    // 기존 디바이스 토큰이 있으면 비활성화
    await this.prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
        device_id: deviceId,
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });

    // 새 토큰 저장
    await this.prisma.refreshToken.create({
      data: {
        token_hash: hashedToken,
        user_id: userId,
        device_id: deviceId,
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType,
        user_agent: deviceInfo.userAgent,
        ip_address: deviceInfo.ip,
        expires_at: expiresAt,
      },
    });

    return deviceId;
  }

  async refreshAccessTokenForDevice(refreshToken: string, req: Request) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const deviceInfo = this.extractDeviceInfo(req);

      // 토큰 해시로 활성 토큰 찾기
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          user_id: payload.sub,
          is_active: true,
          expires_at: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      let validToken = null;
      for (const token of storedTokens) {
        const isValid = await bcrypt.compare(refreshToken, token.token_hash);
        if (isValid) {
          validToken = token;
          break;
        }
      }

      if (!validToken) {
        throw new Error('Invalid refresh token');
      }

      // 토큰 로테이션: 새 토큰 생성
      const newTokens = await this.generateTokens(validToken.user, {
        deviceId: validToken.device_id,
        ...deviceInfo,
      });

      // 마지막 사용 시간 업데이트
      await this.prisma.refreshToken.update({
        where: { id: validToken.id },
        data: { last_used_at: new Date() },
      });

      return newTokens;
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async getActiveDevices(userId: number) {
    return this.prisma.refreshToken.findMany({
      where: {
        user_id: userId,
        is_active: true,
        expires_at: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        device_id: true,
        device_name: true,
        device_type: true,
        last_used_at: true,
        created_at: true,
        ip_address: true,
      },
      orderBy: {
        last_used_at: 'desc',
      },
    });
  }

  async removeDeviceSession(userId: number, deviceId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
        device_id: deviceId,
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });
  }

  async removeAllDeviceSessions(userId: number, exceptDeviceId?: string) {
    const whereClause: any = {
      user_id: userId,
      is_active: true,
    };

    if (exceptDeviceId) {
      whereClause.device_id = {
        not: exceptDeviceId,
      };
    }

    await this.prisma.refreshToken.updateMany({
      where: whereClause,
      data: {
        is_active: false,
      },
    });
  }

  async cleanupExpiredTokens() {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  }
}
