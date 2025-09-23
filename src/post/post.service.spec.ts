import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PostService', () => {
  let service: PostService;
  let prismaService: PrismaService;

  const mockPost = {
    id: 1,
    title: '테스트 게시글',
    content: '테스트 내용',
    author_id: 1,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
    author: {
      id: 1,
      name: '홍길동',
      email: 'test@example.com',
    },
    _count: {
      comments: 0,
    },
  };

  const mockPrismaService = {
    post: {
      create: jest.fn().mockResolvedValue(mockPost),
      findMany: jest.fn().mockResolvedValue([mockPost]),
      findUnique: jest.fn().mockResolvedValue(mockPost),
      update: jest.fn().mockResolvedValue(mockPost),
      delete: jest.fn().mockResolvedValue(mockPost),
      count: jest.fn().mockResolvedValue(1),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a post', async () => {
      const createPostDto = {
        title: '새 게시글',
        content: '새 내용',
      };

      const result = await service.create(createPostDto, 1);

      expect(result).toEqual(mockPost);
      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: {
          title: '새 게시글',
          content: '새 내용',
          author_id: 1,
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
    });
  });

  describe('findAll', () => {
    it('should return posts with pagination', async () => {
      const query = {
        page: 1,
        limit: 10,
        search: '',
        sort: 'latest',
      };

      const result = await service.findAll(query);

      expect(result).toEqual({
        posts: [mockPost],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a post and increment view count', async () => {
      const result = await service.findOne(1);

      expect(result).toEqual(mockPost);
      expect(mockPrismaService.post.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { view_count: { increment: 1 } },
      });
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const updatePostDto = {
        title: '수정된 제목',
        content: '수정된 내용',
      };

      const result = await service.update(1, updatePostDto, 1);

      expect(result).toEqual(mockPost);
    });
  });

  describe('remove', () => {
    it('should remove a post', async () => {
      const result = await service.remove(1, 1);

      expect(result).toEqual({ message: '게시글이 삭제되었습니다.' });
    });
  });
});
