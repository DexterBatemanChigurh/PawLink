import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Follows')
@ApiBearerAuth()
@Controller()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('users/:id/follow')
  @ApiOperation({ summary: 'Seguir usuário' })
  follow(
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.followsService.follow(user.id, targetUserId);
  }

  @Delete('users/:id/follow')
  @ApiOperation({ summary: 'Deixar de seguir usuário' })
  unfollow(
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.followsService.unfollow(user.id, targetUserId);
  }

  @Get('users/:id/followers')
  @ApiOperation({ summary: 'Seguidores de um usuário' })
  getFollowers(@Param('id', ParseUUIDPipe) userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Get('users/:id/following')
  @ApiOperation({ summary: 'Quem um usuário segue' })
  getFollowing(@Param('id', ParseUUIDPipe) userId: string) {
    return this.followsService.getFollowing(userId);
  }

  @Get('users/:id/following/check')
  @ApiOperation({ summary: 'Verifica se o usuário atual segue este usuário' })
  async checkFollowing(
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() user: User,
  ) {
    const following = await this.followsService.isFollowing(user.id, targetUserId);
    return { following };
  }
}
