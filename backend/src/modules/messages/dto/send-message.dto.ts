import { IsUUID, IsString, MaxLength, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  matchId: string;

  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsUUID()
  postId?: string;
}
