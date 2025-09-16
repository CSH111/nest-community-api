import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
}