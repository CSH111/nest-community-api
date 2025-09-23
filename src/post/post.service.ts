import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, authorId: number) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        author_id: authorId,
      },
      include: {
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
    });
  }

  async findAll(query: PostQueryDto) {
    const { page, limit, search, sort } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } },
          ],
        }
      : {};

    const orderBy = this.getOrderBy(sort);

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: +limit,
        orderBy,
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
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, incrementView: boolean = true) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
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
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 조회수 증가
    if (incrementView) {
      await this.prisma.post.update({
        where: { id },
        data: { view_count: { increment: 1 } },
      });
      post.view_count += 1;
    }

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.author_id !== userId) {
      throw new ForbiddenException('게시글을 수정할 권한이 없습니다.');
    }

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
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
    });
  }

  async remove(id: number, userId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.author_id !== userId) {
      throw new ForbiddenException('게시글을 삭제할 권한이 없습니다.');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: '게시글이 삭제되었습니다.' };
  }

  private getOrderBy(sort: string) {
    switch (sort) {
      case 'oldest':
        return { created_at: 'asc' as const };
      case 'views':
        return { view_count: 'desc' as const };
      case 'comments':
        return { comments: { _count: 'desc' as const } };
      case 'latest':
      default:
        return { created_at: 'desc' as const };
    }
  }
}
