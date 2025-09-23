import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService: CommentService;

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

  const mockCommentService = {
    create: jest.fn().mockResolvedValue(mockComment),
    findByPost: jest.fn().mockResolvedValue([mockComment]),
    findOne: jest.fn().mockResolvedValue(mockComment),
    update: jest.fn().mockResolvedValue(mockComment),
    remove: jest.fn().mockResolvedValue({ message: '댓글이 삭제되었습니다.' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: mockCommentService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CommentController>(CommentController);
    commentService = module.get<CommentService>(CommentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const createCommentDto = {
        content: '새 댓글',
        parent_id: null,
      };
      const mockReq = { user: { id: 1 } } as any;

      const result = await controller.create(1, createCommentDto, mockReq);

      expect(result).toEqual(mockComment);
      expect(mockCommentService.create).toHaveBeenCalledWith(1, createCommentDto, 1);
    });
  });

  describe('findByPost', () => {
    it('should return comments for a post', async () => {
      const result = await controller.findByPost(1);

      expect(result).toEqual([mockComment]);
      expect(mockCommentService.findByPost).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      const updateCommentDto = {
        content: '수정된 댓글',
      };
      const mockReq = { user: { id: 1 } } as any;

      const result = await controller.update(1, updateCommentDto, mockReq);

      expect(result).toEqual(mockComment);
      expect(mockCommentService.update).toHaveBeenCalledWith(1, updateCommentDto, 1);
    });
  });

  describe('remove', () => {
    it('should remove a comment', async () => {
      const mockReq = { user: { id: 1 } } as any;

      const result = await controller.remove(1, mockReq);

      expect(result).toEqual({ message: '댓글이 삭제되었습니다.' });
      expect(mockCommentService.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
