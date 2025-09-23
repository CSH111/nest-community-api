import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Post()
  // async create(@Body() createUserDto: CreateUserDto) {
  //   return this.userService.create(createUserDto);
  // }

  @Get(':id')
  @ApiOperation({ summary: '특정 사용자 조회', description: 'ID로 특정 사용자 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 3 },
        name: { type: 'string', example: '홍길동' },
        email: { type: 'string', example: 'user@example.com' },
        provider: { type: 'string', example: 'google' },
        provider_id: { type: 'string', example: '1234567890' },
        created_at: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00.000Z' },
        updated_at: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' }
      }
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Get(':id/posts')
  @ApiOperation({ summary: '사용자 게시글 목록 조회', description: '특정 사용자가 작성한 모든 게시글을 조회합니다' })
  @ApiParam({ name: 'id', description: '사용자 ID', example: 3 })
  @ApiResponse({
    status: 200,
    description: '사용자 게시글 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          title: { type: 'string', example: '게시글 제목' },
          author_id: { type: 'number', example: 1 },
          view_count: { type: 'number', example: 15 },
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
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
      },
    },
  })
  async findUserPosts(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.userService.findUserPosts(id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '사용자 댓글 목록 조회', description: '특정 사용자가 작성한 모든 댓글을 조회합니다' })
  @ApiParam({ name: 'id', description: '사용자 ID', example: 3 })
  @ApiResponse({
    status: 200,
    description: '사용자 댓글 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          content: { type: 'string', example: '댓글 내용' },
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
          post: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '게시글 제목' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
      },
    },
  })
  async findUserComments(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.userService.findUserComments(id);
  }

  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   try {
  //     return await this.userService.update(+id, updateUserDto);
  //   } catch (error) {
  //     throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  //   }
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   try {
  //     await this.userService.remove(+id);
  //     return { message: 'User deleted successfully' };
  //   } catch (error) {
  //     throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  //   }
  // }
}