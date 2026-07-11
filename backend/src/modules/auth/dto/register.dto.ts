import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RegisterUserRole {
  USER = 'user',
  ONG = 'ong',
  VETERINARY = 'veterinary',
  PETSHOP = 'petshop',
}

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: RegisterUserRole, default: RegisterUserRole.USER })
  @IsOptional()
  @IsEnum(RegisterUserRole)
  role?: RegisterUserRole;
}
