import { Controller, Get, Post, Delete, Body, Req, Res, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiSecurity, ApiCookieAuth, ApiParam } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Google OAuth 콜백', description: 'Google OAuth 인증 후 JWT 다중세션 토큰 발급' })
  @ApiResponse({ status: 302, description: '인증 성공 시 프론트엔드로 리다이렉트' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // OAuth 성공 후 처리
    const user = req.user;
    console.log('req.user;: ', req.user);
    console.log('Google OAuth 성공:', user);

    // 기기 정보 추출
    const deviceInfo = this.extractDeviceInfo(req);

    // JWT 다중세션 토큰 생성
    const tokens = await this.authService.generateTokens(user, deviceInfo);

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
      deviceName: this.getDeviceName(userAgent)
    };
  }

  private getDeviceName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    return 'Unknown Device';
  }

  @Get('profile')
  @ApiOperation({ summary: '사용자 프로필 조회', description: 'JWT 토큰으로 인증된 사용자 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 반환',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '홍길동' },
        email: { type: 'string', example: 'user@example.com' },
        provider: { type: 'string', example: 'google' },
        provider_id: { type: 'string', example: '1234567890' },
        created_at: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00.000Z' },
        updated_at: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    examples: {
      'token-expired': {
        summary: '토큰 만료',
        value: {
          statusCode: 401,
          message: '토큰이 만료되었습니다',
          error: 'TOKEN_EXPIRED'
        }
      },
      'auth-failed': {
        summary: '인증 실패',
        value: {
          statusCode: 401,
          message: '인증에 실패했습니다',
          error: 'AUTHENTICATION_FAILED'
        }
      }
    }
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request) {
    return req.user;
  }


  @Post('refresh-access')
  @ApiOperation({ summary: 'Access Token 갱신', description: 'JWT 다중세션 방식으로 토큰 갱신 (토큰 로테이션 포함)' })
  @ApiResponse({
    status: 200,
    description: 'Access Token 갱신 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Access Token이 갱신되었습니다.'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않은 Refresh Token',
  })
  @ApiSecurity('RefreshTokenAuth')
  async refreshAccess(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token not found' });
      }

      // JWT 다중세션 방식으로 토큰 갱신
      const tokens = await this.authService.refreshAccessTokenForDevice(refreshToken, req);

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
  @ApiOperation({ summary: '로그아웃', description: 'JWT 다중세션 방식으로 현재 기기만 로그아웃' })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '로그아웃되었습니다.' }
      }
    }
  })
  @ApiSecurity('RefreshTokenAuth')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        // JWT 다중세션: 현재 기기의 세션만 비활성화
        await this.authService.removeCurrentDeviceSession(refreshToken);
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

  // JWT 다중세션 관리 API 엔드포인트들
  @Get('devices')
  @ApiOperation({ summary: '활성 기기 목록 조회', description: '사용자의 모든 활성 세션(기기) 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '활성 기기 목록 반환',
    schema: {
      type: 'object',
      properties: {
        devices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clm123456' },
              device_id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
              user_id: { type: 'number', example: 1 },
              device_name: { type: 'string', example: 'Chrome Browser' },
              device_type: { type: 'string', example: 'desktop' },
              last_used_at: { type: 'string', format: 'date-time', example: '2023-01-01T12:00:00.000Z' },
              created_at: { type: 'string', format: 'date-time', example: '2023-01-01T10:00:00.000Z' },
              ip_address: { type: 'string', example: '192.168.1.1' },
              is_active: { type: 'boolean', example: true }
            }
          }
        },
        total: { type: 'number', example: 3 }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    examples: {
      'token-expired': {
        summary: '토큰 만료',
        value: {
          statusCode: 401,
          message: '토큰이 만료되었습니다',
          error: 'TOKEN_EXPIRED'
        }
      },
      'auth-failed': {
        summary: '인증 실패',
        value: {
          statusCode: 401,
          message: '인증에 실패했습니다',
          error: 'AUTHENTICATION_FAILED'
        }
      }
    }
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(AuthGuard('jwt'))
  async getActiveDevices(@Req() req: Request) {
    const user = req.user as any;
    const devices = await this.authService.getActiveDevices(user.id);

    return {
      devices,
      total: devices.length,
    };
  }


  @Post('devices/all/logout')
  @ApiOperation({ summary: '모든 다른 기기 로그아웃', description: '현재 기기를 제외한 모든 기기 세션 무효화' })
  @ApiResponse({
    status: 200,
    description: '모든 다른 기기 로그아웃 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '다른 모든 기기에서 로그아웃되었습니다.' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    examples: {
      'token-expired': {
        summary: '토큰 만료',
        value: {
          statusCode: 401,
          message: '토큰이 만료되었습니다',
          error: 'TOKEN_EXPIRED'
        }
      },
      'auth-failed': {
        summary: '인증 실패',
        value: {
          statusCode: 401,
          message: '인증에 실패했습니다',
          error: 'AUTHENTICATION_FAILED'
        }
      }
    }
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(AuthGuard('jwt'))
  async logoutAllOtherDevices(@Req() req: Request) {
    const user = req.user as any;
    const refreshToken = req.cookies?.refresh_token;

    // 현재 기기의 device_id를 찾아서 제외
    let currentDeviceId = null;
    if (refreshToken) {
      try {
        const payload = this.authService['jwtService'].verify(refreshToken);
        const currentToken = await this.authService['prisma'].refreshToken.findFirst({
          where: {
            user_id: payload.sub,
            is_active: true,
          },
        });
        if (currentToken) {
          currentDeviceId = currentToken.device_id;
        }
      } catch (error) {
        // 토큰이 유효하지 않으면 모든 기기 로그아웃
      }
    }

    await this.authService.removeAllDeviceSessions(user.id, currentDeviceId);

    return { message: '다른 모든 기기에서 로그아웃되었습니다.' };
  }

  @Post('devices/:deviceId/logout')
  @ApiOperation({ summary: '특정 기기 로그아웃', description: '본인 소유 기기만 로그아웃 가능' })
  @ApiParam({ name: 'deviceId', description: '기기 ID' })
  @ApiResponse({
    status: 200,
    description: '기기 로그아웃 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '기기 device-id-123가 로그아웃되었습니다.' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '해당 기기를 찾을 수 없거나 접근 권한 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '해당 기기를 찾을 수 없거나 접근 권한이 없습니다.' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    examples: {
      'token-expired': {
        summary: '토큰 만료',
        value: {
          statusCode: 401,
          message: '토큰이 만료되었습니다',
          error: 'TOKEN_EXPIRED'
        }
      },
      'auth-failed': {
        summary: '인증 실패',
        value: {
          statusCode: 401,
          message: '인증에 실패했습니다',
          error: 'AUTHENTICATION_FAILED'
        }
      }
    }
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(AuthGuard('jwt'))
  async logoutDevice(@Req() req: Request, @Param('deviceId') deviceId: string) {
    try {
      const user = req.user as any;
      await this.authService.removeDeviceSession(user.id, deviceId);

      return { message: `기기 ${deviceId}가 로그아웃되었습니다.` };
    } catch (error) {
      return {
        statusCode: 400,
        message: error.message || '기기 로그아웃에 실패했습니다.',
        error: 'Bad Request'
      };
    }
  }

  @Post('devices/all/force-logout')
  @ApiOperation({ summary: '모든 기기 강제 로그아웃', description: '현재 기기를 포함한 모든 기기 세션 무효화' })
  @ApiResponse({
    status: 200,
    description: '모든 기기 강제 로그아웃 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '모든 기기에서 강제 로그아웃되었습니다.' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    examples: {
      'token-expired': {
        summary: '토큰 만료',
        value: {
          statusCode: 401,
          message: '토큰이 만료되었습니다',
          error: 'TOKEN_EXPIRED'
        }
      },
      'auth-failed': {
        summary: '인증 실패',
        value: {
          statusCode: 401,
          message: '인증에 실패했습니다',
          error: 'AUTHENTICATION_FAILED'
        }
      }
    }
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(AuthGuard('jwt'))
  async forceLogoutAllDevices(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    await this.authService.removeAllDeviceSessions(user.id);

    // 현재 기기의 쿠키도 삭제
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return res.json({ message: '모든 기기에서 강제 로그아웃되었습니다.' });
  }
}
