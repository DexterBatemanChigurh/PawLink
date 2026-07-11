import { Controller, Post, Delete, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Blocks')
@ApiBearerAuth()
@Controller('users/:id/block')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  @ApiOperation({ summary: 'Bloquear usuário' })
  block(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.blocksService.block(user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Desbloquear usuário' })
  unblock(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.blocksService.unblock(user.id, id);
  }
}
