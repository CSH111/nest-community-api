import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: '게시글 제목',
    example: '안녕하세요! 첫 게시글입니다.',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: '게시글 내용',
    example: '게시글 내용을 여기에 작성합니다.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: '공지글 여부',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean;
}