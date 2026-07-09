import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Timeline')
@Controller('pets/:petId/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar evento na timeline do pet' })
  create(
    @Param('petId', ParseUUIDPipe) petId: string,
    @Body() dto: CreateTimelineEventDto,
  ) {
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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.timelineService.remove(id);
  }
}
