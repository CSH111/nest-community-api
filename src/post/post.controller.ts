import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiOperation({ summary: '게시글 작성', description: '새 게시글을 작성합니다' })
  @ApiResponse({
    status: 201,
    description: '게시글 작성 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '안녕하세요!' },
        content: { type: 'string', example: '첫 게시글입니다.' },
        author_id: { type: 'number', example: 1 },
        view_count: { type: 'number', example: 0 },
        is_pinned: { type: 'boolean', example: false },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        author: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '홍길동' },
            email: { type: 'string', example: 'user@example.com' },
          },
        },
        _count: {
          type: 'object',
          properties: {
            comments: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    examples: {
      'token-expired': {
        summary: '토큰 만료',
        value: {
          statusCode: 401,
          message: '토큰이 만료되었습니다',
          error: 'TOKEN_EXPIRED',
        },
      },
      'auth-failed': {
        summary: '인증 실패',
        value: {
          statusCode: 401,
          message: '인증에 실패했습니다',
          error: 'AUTHENTICATION_FAILED',
        },
      },
    },
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(JwtAuthGuard)
  create(@Body() createPostDto: CreatePostDto, @Req() req: Request) {
    const user = req.user as any;
    return this.postService.create(createPostDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '게시글 목록 조회', description: '게시글 목록을 조회합니다 (인증 불필요)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 게시글 수', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: '검색어', example: '안녕' })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: '정렬 기준',
    enum: ['latest', 'oldest', 'views', 'comments'],
    example: 'latest'
  })
  @ApiResponse({
    status: 200,
    description: '게시글 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        posts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '안녕하세요!' },
              author_id: { type: 'number', example: 1 },
              view_count: { type: 'number', example: 15 },
              is_pinned: { type: 'boolean', example: false },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '홍길동' },
                  email: { type: 'string', example: 'user@example.com' },
                },
              },
              _count: {
                type: 'object',
                properties: {
                  comments: { type: 'number', example: 3 },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  findAll(@Query() query: PostQueryDto) {
    return this.postService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '게시글 상세 조회', description: '특정 게시글을 조회합니다 (조회수 증가, 인증 불필요)' })
  @ApiParam({ name: 'id', description: '게시글 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '게시글 조회 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '안녕하세요!' },
        content: { type: 'string', example: '첫 게시글입니다.' },
        author_id: { type: 'number', example: 1 },
        view_count: { type: 'number', example: 16 },
        is_pinned: { type: 'boolean', example: false },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        author: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '홍길동' },
            email: { type: 'string', example: 'user@example.com' },
          },
        },
        _count: {
          type: 'object',
          properties: {
            comments: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '게시글을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '게시글을 찾을 수 없습니다.' },
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '게시글 수정', description: '게시글을 수정합니다 (작성자만 가능)' })
  @ApiParam({ name: 'id', description: '게시글 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '게시글 수정 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '수정된 제목' },
        content: { type: 'string', example: '수정된 내용' },
        author_id: { type: 'number', example: 1 },
        view_count: { type: 'number', example: 15 },
        is_pinned: { type: 'boolean', example: false },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    examples: {
      'token-expired': {
        summary: '토큰 만료',
        value: {
          statusCode: 401,
          message: '토큰이 만료되었습니다',
          error: 'TOKEN_EXPIRED',
        },
      },
      'auth-failed': {
        summary: '인증 실패',
        value: {
          statusCode: 401,
          message: '인증에 실패했습니다',
          error: 'AUTHENTICATION_FAILED',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '게시글을 수정할 권한이 없습니다.' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '게시글을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '게시글을 찾을 수 없습니다.' },
      },
    },
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.postService.update(id, updatePostDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '게시글 삭제', description: '게시글을 삭제합니다 (작성자만 가능)' })
  @ApiParam({ name: 'id', description: '게시글 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '게시글 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '게시글이 삭제되었습니다.' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    examples: {
      'token-expired': {
        summary: '토큰 만료',
        value: {
          statusCode: 401,
          message: '토큰이 만료되었습니다',
          error: 'TOKEN_EXPIRED',
        },
      },
      'auth-failed': {
        summary: '인증 실패',
        value: {
          statusCode: 401,
          message: '인증에 실패했습니다',
          error: 'AUTHENTICATION_FAILED',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '게시글을 삭제할 권한이 없습니다.' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '게시글을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '게시글을 찾을 수 없습니다.' },
      },
    },
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as any;
    return this.postService.remove(id, user.id);
  }
}