import { Controller, Get, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Notificações do usuário' })
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findByUser(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Quantidade de não lidas' })
  countUnread(@CurrentUser() user: User) {
    return this.notificationsService.countUnread(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar como lida' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
