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

  @Get()
  @ApiOperation({ summary: '모든 사용자 조회', description: 'JWT 인증이 필요한 모든 사용자 목록 조회' })
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiSecurity('AccessTokenAuth')
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.userService.findAll();
  }

  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   const user = await this.userService.findOne(+id);
  //   if (!user) {
  //     throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  //   }
  //   return user;
  // }

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