import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('comments')
@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('posts/:postId/comments')
  @ApiOperation({ summary: '댓글 작성', description: '게시글에 댓글을 작성합니다' })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: 1 })
  @ApiResponse({
    status: 201,
    description: '댓글 작성 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        content: { type: 'string', example: '좋은 게시글이네요!' },
        post_id: { type: 'number', example: 1 },
        author_id: { type: 'number', example: 1 },
        parent_id: { type: 'number', nullable: true, example: null },
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
        replies: { type: 'array', items: {} },
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
  create(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.commentService.create(postId, createCommentDto, user.id);
  }

  @Get('posts/:postId/comments')
  @ApiOperation({
    summary: '댓글 목록 조회',
    description: '특정 게시글의 댓글 목록을 조회합니다 (인증 불필요)',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '댓글 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          content: { type: 'string', example: '좋은 게시글이네요!' },
          post_id: { type: 'number', example: 1 },
          author_id: { type: 'number', example: 1 },
          parent_id: { type: 'number', nullable: true, example: null },
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
          replies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 2 },
                content: { type: 'string', example: '대댓글입니다.' },
                author: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 2 },
                    name: { type: 'string', example: '김철수' },
                    email: { type: 'string', example: 'user2@example.com' },
                  },
                },
              },
            },
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
  findByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentService.findByPost(postId);
  }


  @Patch('comments/:id')
  @ApiOperation({
    summary: '댓글 수정',
    description: '댓글을 수정합니다 (작성자만 가능)',
  })
  @ApiParam({ name: 'id', description: '댓글 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '댓글 수정 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        content: { type: 'string', example: '수정된 댓글입니다.' },
        post_id: { type: 'number', example: 1 },
        author_id: { type: 'number', example: 1 },
        parent_id: { type: 'number', nullable: true, example: null },
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
        message: { type: 'string', example: '댓글을 수정할 권한이 없습니다.' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '댓글을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '댓글을 찾을 수 없습니다.' },
      },
    },
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.commentService.update(id, updateCommentDto, user.id);
  }

  @Delete('comments/:id')
  @ApiOperation({
    summary: '댓글 삭제',
    description: '댓글을 삭제합니다 (작성자만 가능)',
  })
  @ApiParam({ name: 'id', description: '댓글 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '댓글 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '댓글이 삭제되었습니다.' },
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
        message: { type: 'string', example: '댓글을 삭제할 권한이 없습니다.' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '댓글을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '댓글을 찾을 수 없습니다.' },
      },
    },
  })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as any;
    return this.commentService.remove(id, user.id);
  }
}