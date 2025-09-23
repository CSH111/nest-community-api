import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('PostController', () => {
  let controller: PostController;
  let postService: PostService;

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

  const mockPostService = {
    create: jest.fn().mockResolvedValue(mockPost),
    findAll: jest.fn().mockResolvedValue({
      posts: [mockPost],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    }),
    findOne: jest.fn().mockResolvedValue(mockPost),
    update: jest.fn().mockResolvedValue(mockPost),
    remove: jest.fn().mockResolvedValue({ message: '게시글이 삭제되었습니다.' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: mockPostService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PostController>(PostController);
    postService = module.get<PostService>(PostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a post', async () => {
      const createPostDto = {
        title: '새 게시글',
        content: '새 내용',
      };
      const mockReq = { user: { id: 1 } } as any;

      const result = await controller.create(createPostDto, mockReq);

      expect(result).toEqual(mockPost);
      expect(mockPostService.create).toHaveBeenCalledWith(createPostDto, 1);
    });
  });

  describe('findAll', () => {
    it('should return posts list', async () => {
      const query = {
        page: 1,
        limit: 10,
        search: '',
        sort: 'latest',
      };

      const result = await controller.findAll(query);

      expect(result).toEqual({
        posts: [mockPost],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      expect(mockPostService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a post', async () => {
      const result = await controller.findOne(1);

      expect(result).toEqual(mockPost);
      expect(mockPostService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const updatePostDto = {
        title: '수정된 제목',
        content: '수정된 내용',
      };
      const mockReq = { user: { id: 1 } } as any;

      const result = await controller.update(1, updatePostDto, mockReq);

      expect(result).toEqual(mockPost);
      expect(mockPostService.update).toHaveBeenCalledWith(1, updatePostDto, 1);
    });
  });

  describe('remove', () => {
    it('should remove a post', async () => {
      const mockReq = { user: { id: 1 } } as any;

      const result = await controller.remove(1, mockReq);

      expect(result).toEqual({ message: '게시글이 삭제되었습니다.' });
      expect(mockPostService.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
