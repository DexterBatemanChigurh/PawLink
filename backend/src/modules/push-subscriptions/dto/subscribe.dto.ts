import { IsNotEmpty, IsString } from 'class-validator';

export class SubscribeDto {
  @IsNotEmpty()
  @IsString()
  endpoint: string;

  @IsNotEmpty()
  @IsString()
  p256dh: string;

  @IsNotEmpty()
  @IsString()
  auth: string;
}
