import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5002/auth/google/callback',
      scope: ['email', 'profile'],
      // prompt: 'select_account'
    });
  }
  // async authenticate(req: any, options?: any) {
  //   const authOptions = {
  //     ...options,
  //     prompt: req.query.prompt || 'consent', // 쿼리에서 prompt 값 읽기
  //   };
  //   return super.authenticate(req, authOptions);
  // }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const user = await this.authService.validateGoogleUser(profile);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
