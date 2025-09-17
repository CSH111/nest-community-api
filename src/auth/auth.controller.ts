import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // 구글 로그인 페이지로 리다이렉트
  }

  @Get('google/select-account')
  @UseGuards(AuthGuard('google'))
  googleSelectAccount() {
    // 이 엔드포인트는 prompt=select_account로 Google에 요청
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // OAuth 성공 후 처리
    const user = req.user;
    console.log('req.user;: ', req.user);
    console.log('Google OAuth 성공:', user);

    // JWT 토큰 생성 (Access + Refresh)
    const tokens = await this.authService.generateTokens(user);

    // HttpOnly 쿠키로 토큰 설정 (XSS 공격 방지)
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15분
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 토큰 없이 프론트엔드로 리다이렉트
    res.redirect('http://localhost:3000/auth/success');
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('token')
  async getToken(@Body() body: { userId: number }) {
    const user = await this.authService.findUserById(body.userId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.authService.generateJwtToken(user);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token not found' });
      }

      const tokens = await this.authService.refreshAccessToken(refreshToken);

      // 새로운 토큰들을 쿠키에 설정
      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15분
      });

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      });

      return res.json({ message: '토큰이 갱신되었습니다.' });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        // DB에서 refresh token 삭제
        await this.authService.removeRefreshToken(refreshToken);
      }

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.json({ message: '로그아웃되었습니다.' });
    } catch (error) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.json({ message: '로그아웃되었습니다.' });
    }
  }
}
