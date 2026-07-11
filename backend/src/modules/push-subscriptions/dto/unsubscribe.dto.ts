import { IsNotEmpty, IsString } from 'class-validator';

export class UnsubscribeDto {
  @IsNotEmpty()
  @IsString()
  endpoint: string;
}
