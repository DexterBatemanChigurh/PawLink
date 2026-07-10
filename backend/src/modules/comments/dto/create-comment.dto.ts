import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
