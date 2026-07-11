import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PushSubscriptionsService } from './push-subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Push Notifications')
@Controller('push')
export class PushSubscriptionsController {
  constructor(private readonly pushService: PushSubscriptionsService) {}

  @Public()
  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Chave pública VAPID para push' })
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar subscription push' })
  subscribe(@Body() dto: SubscribeDto, @CurrentUser() user: User) {
    return this.pushService.subscribe(user.id, dto);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover subscription push' })
  unsubscribe(@Body() dto: UnsubscribeDto, @CurrentUser() user: User) {
    return this.pushService.unsubscribe(user.id, dto.endpoint);
  }
}
