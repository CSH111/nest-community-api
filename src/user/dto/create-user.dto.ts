import { ApiProperty } from '@nestjs/swagger';
import { MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '사용자 이름', example: 'John Doe', minLength: 3 })
  @MinLength(3)
  name?: string;

  @ApiProperty({ description: '로그인 제공자', example: 'google' })
  provider?: string;

  @ApiProperty({ description: '제공자별 고유 ID', example: '123456789' })
  provider_id?: string;
}
