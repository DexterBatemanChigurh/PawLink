import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { ConversationDto } from './dto/conversation.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Listar conversas do usuário' })
  getConversations(
    @CurrentUser() user: User,
  ): Promise<ConversationDto[]> {
    return this.messagesService.getConversations(user.id);
  }

  @Get(':matchId')
  @ApiOperation({ summary: 'Listar mensagens de um match' })
  getMessages(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser() user: User,
  ): Promise<Message[]> {
    return this.messagesService.getMessages(matchId, user.id);
  }

  @Patch(':matchId/read')
  @ApiOperation({ summary: 'Marcar mensagens como lidas' })
  markAsRead(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.messagesService.markAsRead(matchId, user.id);
  }
}
