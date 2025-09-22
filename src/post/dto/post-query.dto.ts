import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PostQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 게시글 수',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '검색어 (제목, 내용)',
    example: '안녕하세요',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '정렬 기준',
    example: 'latest',
    enum: ['latest', 'oldest', 'views', 'comments'],
    default: 'latest',
  })
  @IsOptional()
  @IsIn(['latest', 'oldest', 'views', 'comments'])
  sort?: string = 'latest';
}