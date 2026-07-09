import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Matches')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

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
  findAll() {
    return this.matchesService.findAll();
  }

  @Get('pets/:petId')
  @ApiOperation({ summary: 'Solicitações de um pet específico' })
  findByPet(@Param('petId', ParseUUIDPipe) petId: string) {
    return this.matchesService.findByPet(petId);
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
}
