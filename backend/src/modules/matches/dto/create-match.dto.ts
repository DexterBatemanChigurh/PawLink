import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Experiência com animais' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  experience?: string;

  @ApiPropertyOptional({ description: 'Possui casa própria' })
  @IsOptional()
  @IsBoolean()
  hasHouse?: boolean;

  @ApiPropertyOptional({ description: 'Possui outros animais' })
  @IsOptional()
  @IsBoolean()
  hasOtherPets?: boolean;

  @ApiPropertyOptional({ description: 'Motivação para adoção' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivation?: string;
}
