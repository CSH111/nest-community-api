import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

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

  async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id };

    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.updateRefreshToken(user.id, refresh_token);

    return {
      access_token,
      refresh_token,
    };
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token: hashedRefreshToken },
    });
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refresh_token) {
        throw new Error('Invalid refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refresh_token);
      if (!isRefreshTokenValid) {
        throw new Error('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new Error('Invalid refresh token');
    }
  }


  async removeRefreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { refresh_token: null },
      });
    } catch {
      // 토큰이 유효하지 않아도 무시 (이미 로그아웃 상태)
    }
  }
}