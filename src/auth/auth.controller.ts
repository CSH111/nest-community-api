import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    console.log('hihi');
    // 구글 로그인 페이지로 리다이렉트
  }

  @Get('google/select-account')
  @UseGuards(AuthGuard('google'))
  googleSelectAccount() {
    // 이 엔드포인트는 prompt=select_account로 Google에 요청
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response) {
    // OAuth 성공 후 처리
    const user = req.user;
    console.log('req.user;: ', req.user);
    console.log('Google OAuth 성공:', user);

    // 프론트엔드로 리다이렉트 (성공 페이지 또는 메인 페이지)
    res.redirect('http://localhost:5002/users');
  }

  @Get('profile')
  @UseGuards(AuthGuard('google'))
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
