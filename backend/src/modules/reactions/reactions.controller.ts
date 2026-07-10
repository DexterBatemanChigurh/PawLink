import { Controller, Get, Post, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReactionsService } from './reactions.service';
import { ReactDto } from './dto/react.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Reactions')
@ApiBearerAuth()
@Controller('posts/:id/reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Reagir a um post (upsert)' })
  react(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReactDto,
    @CurrentUser() user: User,
  ) {
    return this.reactionsService.upsert(id, user.id, dto.type);
  }

  @Get()
  @ApiOperation({ summary: 'Reações de um post' })
  find(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.reactionsService.findByPostForUser(id, user.id);
  }
}
