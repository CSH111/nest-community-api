import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CommentService', () => {
  let service: CommentService;
  let prismaService: PrismaService;

  const mockComment = {
    id: 1,
    content: '테스트 댓글',
    post_id: 1,
    author_id: 1,
    parent_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    author: {
      id: 1,
      name: '홍길동',
      email: 'test@example.com',
    },
    post: {
      id: 1,
      title: '테스트 게시글',
    },
    replies: [],
  };

  const mockPrismaService = {
    comment: {
      create: jest.fn().mockResolvedValue(mockComment),
      findMany: jest.fn().mockResolvedValue([mockComment]),
      findUnique: jest.fn().mockResolvedValue(mockComment),
      update: jest.fn().mockResolvedValue(mockComment),
      delete: jest.fn().mockResolvedValue(mockComment),
    },
    post: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1,
        title: '테스트 게시글',
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const createCommentDto = {
        content: '새 댓글',
        parent_id: null,
      };

      const result = await service.create(1, createCommentDto, 1);

      expect(result).toEqual(mockComment);
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith({
        data: {
          content: '새 댓글',
          post_id: 1,
          author_id: 1,
          parent_id: null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });
    });
  });

  describe('findByPost', () => {
    it('should return comments for a post', async () => {
      const result = await service.findByPost(1);

      expect(result).toEqual([mockComment]);
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        where: {
          post_id: 1,
          parent_id: null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a comment', async () => {
      const result = await service.findOne(1);

      expect(result).toEqual(mockComment);
      expect(mockPrismaService.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
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
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      const updateCommentDto = {
        content: '수정된 댓글',
      };

      const result = await service.update(1, updateCommentDto, 1);

      expect(result).toEqual(mockComment);
    });
  });

  describe('remove', () => {
    it('should remove a comment', async () => {
      const result = await service.remove(1, 1);

      expect(result).toEqual({ message: '댓글이 삭제되었습니다.' });
    });
  });
});
