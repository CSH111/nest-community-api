import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiSecurity, ApiCookieAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Get('google')
  @ApiOperation({ summary: 'Google OAuth 로그인', description: 'Google OAuth 로그인 페이지로 리다이렉트' })
  @ApiResponse({ status: 302, description: 'Google OAuth 페이지로 리다이렉트' })
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // 구글 로그인 페이지로 리다이렉트
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth 콜백', description: 'Google OAuth 인증 후 JWT 토큰 발급' })
  @ApiResponse({ status: 302, description: '인증 성공 시 프론트엔드로 리다이렉트' })
  @ApiResponse({ status: 401, description: '인증 실패' })
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

    // 팝업 창을 닫는 HTML 반환
    res.send(`
      <html>
        <head><title>로그인 완료</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'LOGIN_SUCCESS' }, '*');
            }
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  @Get('profile')
  @ApiOperation({ summary: '사용자 프로필 조회', description: 'JWT 토큰으로 인증된 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request) {
    return req.user;
  }


  @Post('refresh-access')
  @ApiOperation({ summary: 'Access Token 갱신', description: '만료된 Access Token을 Refresh Token으로 새로 발급 (Refresh Token도 함께 갱신)' })
  @ApiResponse({ status: 200, description: 'Access Token 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 Refresh Token' })
  @ApiSecurity('AccessTokenAuth')
  @ApiSecurity('RefreshTokenAuth')
  async refreshAccess(@Req() req: Request, @Res() res: Response) {
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

      return res.json({ message: 'Access Token이 갱신되었습니다.' });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }


  @Post('logout')
  @ApiOperation({ summary: '로그아웃', description: '토큰 무효화 및 쿠키 삭제' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiSecurity('AccessTokenAuth')
  @ApiSecurity('RefreshTokenAuth')
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
