import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateFollowDto {
  @ApiProperty()
  @IsUUID()
  targetUserId: string;
}
