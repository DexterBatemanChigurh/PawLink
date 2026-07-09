import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMatchDto {
  @ApiPropertyOptional({ description: 'Mensagem do interessado' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({ description: 'Telefone para contato' })
  @IsOptional()
  @IsString()
  phone?: string;
}
