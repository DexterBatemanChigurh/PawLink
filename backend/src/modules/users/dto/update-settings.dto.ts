import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @IsIn(['public', 'followers', 'private'])
  postVisibility?: string;

  @IsOptional()
  @IsString()
  @IsIn(['everyone', 'followers', 'nobody'])
  messagePrivacy?: string;

  @IsOptional()
  @IsBoolean()
  notificationPush?: boolean;
}
