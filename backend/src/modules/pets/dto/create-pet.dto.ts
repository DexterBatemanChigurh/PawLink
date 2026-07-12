import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PetSpecies, PetSize, PetStatus } from '../entities/pet.entity';

export class CreatePetDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: PetSpecies })
  @IsEnum(PetSpecies)
  species: PetSpecies;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ enum: PetSize })
  @IsOptional()
  @IsEnum(PetSize)
  size?: PetSize;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ageUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  castrated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vaccinated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  temperament?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  story?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  personality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialNeeds?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
