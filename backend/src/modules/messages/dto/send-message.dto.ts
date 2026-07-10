import { IsUUID, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  matchId: string;

  @IsString()
  @MaxLength(2000)
  content: string;
}
