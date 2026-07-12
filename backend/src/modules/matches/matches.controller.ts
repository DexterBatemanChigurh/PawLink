import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PetsService } from '../pets/pets.service';

@ApiTags('Matches')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly petsService: PetsService,
  ) {}

  @Post('pets/:petId')
  @ApiOperation({ summary: 'Manifestar interesse em adotar um pet' })
  create(
    @Param('petId', ParseUUIDPipe) petId: string,
    @Body() dto: CreateMatchDto,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.create(petId, user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Meus pedidos de adoção' })
  findMy(@CurrentUser() user: User) {
    return this.matchesService.findByUser(user.id);
  }

  @Get('received')
  @ApiOperation({ summary: 'Solicitações recebidas nos meus pets' })
  findReceived(@CurrentUser() user: User) {
    return this.matchesService.findByPetOwner(user.id);
  }

  @Get('all')
  @ApiOperation({ summary: 'Todas as solicitações (admin)' })
  findAll(@CurrentUser() user: User) {
    if (user.role !== 'admin') throw new ForbiddenException('Apenas administradores');
    return this.matchesService.findAll();
  }

  @Get('pets/:petId')
  @ApiOperation({ summary: 'Solicitações de um pet específico' })
  async findByPet(
    @Param('petId', ParseUUIDPipe) petId: string,
    @CurrentUser() user: User,
  ) {
    const pet = await this.petsService.findById(petId);
    if (pet.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Apenas o tutor do pet pode ver as solicitações');
    }
    return this.matchesService.findByPet(petId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter match por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.matchesService.findById(id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Aceitar/rejeitar pedido de adoção' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMatchDto,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.updateStatus(id, user.id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar interesse (interessado)' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.cancel(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover match e conversa' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.removeWithOwner(id, user.id);
  }
}
