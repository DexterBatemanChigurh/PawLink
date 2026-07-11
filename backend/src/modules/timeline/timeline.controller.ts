import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PetsService } from '../pets/pets.service';

@ApiTags('Timeline')
@Controller('pets/:petId/timeline')
export class TimelineController {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly petsService: PetsService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar evento na timeline do pet' })
  async create(
    @Param('petId', ParseUUIDPipe) petId: string,
    @Body() dto: CreateTimelineEventDto,
    @CurrentUser() user: User,
  ) {
    const pet = await this.petsService.findById(petId);
    if (pet.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Apenas o tutor do pet pode adicionar eventos');
    }
    return this.timelineService.create(petId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar timeline do pet' })
  findAll(@Param('petId', ParseUUIDPipe) petId: string) {
    return this.timelineService.findByPet(petId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover evento da timeline' })
  async remove(
    @Param('petId', ParseUUIDPipe) petId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const pet = await this.petsService.findById(petId);
    if (pet.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Apenas o tutor do pet pode remover eventos');
    }
    return this.timelineService.remove(id);
  }
}
