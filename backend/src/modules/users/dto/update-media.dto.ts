import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMediaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;
}
