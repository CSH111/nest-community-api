import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  
  // async create(createUserDto: CreateUserDto) {
  //   return this.prisma.user.create({
  //     data: createUserDto,
  //   });
  // }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findUserPosts(userId: number) {
    return this.prisma.post.findMany({
      where: { author_id: userId },
      select: {
        id: true,
        title: true,
        author_id: true,
        view_count: true,
        created_at: true,
        updated_at: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findUserComments(userId: number) {
    return this.prisma.comment.findMany({
      where: { author_id: userId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
