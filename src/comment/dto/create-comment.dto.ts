import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '좋은 게시글이네요! 감사합니다.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: '부모 댓글 ID (대댓글인 경우)',
    example: null,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parent_id?: number;
}