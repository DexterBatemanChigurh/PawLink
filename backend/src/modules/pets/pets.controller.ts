import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Pet } from './entities/pet.entity';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cadastrar novo pet' })
  create(@Body() dto: CreatePetDto, @CurrentUser() user: User): Promise<Pet> {
    return this.petsService.create(dto, user.id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar pets com filtros' })
  findAll(
    @Query('species') species?: string,
    @Query('size') size?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('available') available?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.petsService.findAll({
      species,
      size,
      city,
      state,
      available: available === 'true' ? true : available === 'false' ? false : undefined,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obter pet por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.petsService.findById(id);
  }

  @Get('my/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar meus pets' })
  findMyPets(@CurrentUser() user: User) {
    return this.petsService.findByOwner(user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar pet' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePetDto,
    @CurrentUser() user: User,
  ) {
    return this.petsService.updateWithOwner(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover pet (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.petsService.softRemoveWithOwner(id, user.id, user.role);
  }
}
