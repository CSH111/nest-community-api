import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: '토큰이 만료되었습니다',
        error: 'TOKEN_EXPIRED'
      });
    }

    if (err || !user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: '인증에 실패했습니다',
        error: 'AUTHENTICATION_FAILED'
      });
    }

    return user;
  }
}