import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    name: '홍길동',
    email: 'test@example.com',
    provider: 'google',
    provider_id: '1234567890',
    created_at: new Date(),
    updated_at: new Date(),
  };

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
  };

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      findMany: jest.fn().mockResolvedValue([mockUser]),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      delete: jest.fn().mockResolvedValue(mockUser),
    },
    post: {
      findMany: jest.fn().mockResolvedValue([mockPost]),
      findUnique: jest.fn().mockResolvedValue(mockPost),
      create: jest.fn().mockResolvedValue(mockPost),
      update: jest.fn().mockResolvedValue(mockPost),
      delete: jest.fn().mockResolvedValue(mockPost),
      count: jest.fn().mockResolvedValue(1),
    },
    comment: {
      findMany: jest.fn().mockResolvedValue([mockComment]),
      findUnique: jest.fn().mockResolvedValue(mockComment),
      create: jest.fn().mockResolvedValue(mockComment),
      update: jest.fn().mockResolvedValue(mockComment),
      delete: jest.fn().mockResolvedValue(mockComment),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    Object.values(mockPrismaService).forEach(method => {
      if (typeof method === 'object') {
        Object.values(method).forEach(mock => {
          if (jest.isMockFunction(mock)) {
            mock.mockClear();
          }
        });
      } else if (jest.isMockFunction(method)) {
        method.mockClear();
      }
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Apply the same configuration as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  // Helper function to generate access token
  const generateAccessToken = (userId: number = 1) => {
    return jwtService.sign(
      { sub: userId, email: 'test@example.com' },
      { secret: 'test-secret', expiresIn: '15m' }
    );
  };

  // Helper function to create authenticated request
  const authenticatedRequest = (method: string, url: string, token?: string) => {
    const accessToken = token || generateAccessToken();
    return request(app.getHttpServer())
      [method](url)
      .set('Cookie', [`access_token=${accessToken}`]);
  };

  describe('Health Check', () => {
    it('should be defined', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Auth Endpoints', () => {
    it('/auth/google (GET) should redirect to Google OAuth', () => {
      return request(app.getHttpServer())
        .get('/auth/google')
        .expect(302);
    });

    it('/auth/profile (GET) should require authentication', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('/auth/profile (GET) should return user profile when authenticated', () => {
      return authenticatedRequest('get', '/auth/profile')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 1);
          expect(res.body).toHaveProperty('email', 'test@example.com');
        });
    });

    it('/auth/devices (GET) should return active devices when authenticated', () => {
      return authenticatedRequest('get', '/auth/devices')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('devices');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.devices)).toBe(true);
        });
    });
  });

  describe('Posts Endpoints', () => {
    it('/posts (GET) should return posts list', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('posts');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.posts)).toBe(true);
          expect(res.body.posts).toHaveLength(1);
          expect(res.body.posts[0]).toHaveProperty('id', 1);
          expect(res.body.posts[0]).toHaveProperty('title', '테스트 게시글');
          expect(res.body.pagination).toHaveProperty('total', 1);
        });
    });

    it('/posts (POST) should require authentication', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Test Post',
          content: 'Test Content'
        })
        .expect(401);
    });

    it('/posts (POST) should create post when authenticated', () => {
      return authenticatedRequest('post', '/posts')
        .send({
          title: 'New Test Post',
          content: 'New Test Content'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', 'New Test Post');
          expect(res.body).toHaveProperty('content', 'New Test Content');
          expect(res.body).toHaveProperty('author');
        });
    });

    it('/posts/1 (PATCH) should update post when authenticated as author', () => {
      return authenticatedRequest('patch', '/posts/1')
        .send({
          title: 'Updated Title',
          content: 'Updated Content'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Updated Title');
          expect(res.body).toHaveProperty('content', 'Updated Content');
        });
    });

    it('/posts/1 (DELETE) should delete post when authenticated as author', () => {
      return authenticatedRequest('delete', '/posts/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', '게시글이 삭제되었습니다.');
        });
    });

    it('/posts/1 (GET) should return post detail', () => {
      return request(app.getHttpServer())
        .get('/posts/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 1);
          expect(res.body).toHaveProperty('title', '테스트 게시글');
          expect(res.body).toHaveProperty('content', '테스트 내용');
          expect(res.body).toHaveProperty('author');
          expect(res.body).toHaveProperty('_count');
        });
    });
  });

  describe('Users Endpoints', () => {
    it('/users/1 (GET) should return user info', () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 1);
          expect(res.body).toHaveProperty('name', '홍길동');
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('provider', 'google');
        });
    });

    it('/users/1/posts (GET) should return user posts', () => {
      return request(app.getHttpServer())
        .get('/users/1/posts')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('id', 1);
          expect(res.body[0]).toHaveProperty('title', '테스트 게시글');
          expect(res.body[0]).toHaveProperty('author');
        });
    });

    it('/users/1/comments (GET) should return user comments', () => {
      return request(app.getHttpServer())
        .get('/users/1/comments')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('id', 1);
          expect(res.body[0]).toHaveProperty('content', '테스트 댓글');
          expect(res.body[0]).toHaveProperty('post');
        });
    });
  });

  describe('Comments Endpoints', () => {
    it('/posts/1/comments (GET) should return post comments', () => {
      return request(app.getHttpServer())
        .get('/posts/1/comments')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('id', 1);
          expect(res.body[0]).toHaveProperty('content', '테스트 댓글');
          expect(res.body[0]).toHaveProperty('author');
        });
    });

    it('/posts/1/comments (POST) should require authentication', () => {
      return request(app.getHttpServer())
        .post('/posts/1/comments')
        .send({
          content: 'Test Comment'
        })
        .expect(401);
    });

    it('/posts/1/comments (POST) should create comment when authenticated', () => {
      return authenticatedRequest('post', '/posts/1/comments')
        .send({
          content: 'New Test Comment'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('content', 'New Test Comment');
          expect(res.body).toHaveProperty('author');
          expect(res.body).toHaveProperty('post_id', 1);
        });
    });

    it('/comments/1 (PATCH) should update comment when authenticated as author', () => {
      return authenticatedRequest('patch', '/comments/1')
        .send({
          content: 'Updated Comment'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('content', 'Updated Comment');
        });
    });

    it('/comments/1 (DELETE) should delete comment when authenticated as author', () => {
      return authenticatedRequest('delete', '/comments/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', '댓글이 삭제되었습니다.');
        });
    });
  });
});
