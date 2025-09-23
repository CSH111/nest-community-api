import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 1,
    name: '홍길동',
    email: 'test@example.com',
    provider: 'google',
    provider_id: '1234567890',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
    comment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no users found', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne(1);

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('findUserPosts', () => {
    it('should return user posts', async () => {
      const mockPosts = [
        {
          id: 1,
          title: '게시글 제목',
          author_id: 1,
          view_count: 10,
          created_at: new Date(),
          updated_at: new Date(),
          author: mockUser,
          _count: { comments: 3 },
        },
      ];

      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.findUserPosts(1);

      expect(result).toEqual(mockPosts);
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { author_id: 1 },
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
    });

    it('should return empty array when user has no posts', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);

      const result = await service.findUserPosts(1);

      expect(result).toEqual([]);
    });
  });

  describe('findUserComments', () => {
    it('should return user comments', async () => {
      const mockComments = [
        {
          id: 1,
          content: '댓글 내용',
          post_id: 1,
          author_id: 1,
          parent_id: null,
          created_at: new Date(),
          updated_at: new Date(),
          author: mockUser,
          post: { id: 1, title: '게시글 제목' },
        },
      ];

      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.findUserComments(1);

      expect(result).toEqual(mockComments);
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        where: { author_id: 1 },
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
    });

    it('should return empty array when user has no comments', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);

      const result = await service.findUserComments(1);

      expect(result).toEqual([]);
    });
  });
});