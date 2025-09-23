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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
        id: { type: 'number', example: 1 },
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
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(+id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
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