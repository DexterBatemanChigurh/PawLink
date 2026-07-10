import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReactionType } from '../entities/reaction.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ReactDto {
  @ApiProperty({ enum: ReactionType })
  @IsEnum(ReactionType)
  @IsNotEmpty()
  type: ReactionType;
}
