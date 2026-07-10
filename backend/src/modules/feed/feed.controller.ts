import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from '../posts/posts.service';
import { FollowsService } from '../follows/follows.service';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Feed')
@ApiBearerAuth()
@Controller('feed')
export class FeedController {
  constructor(
    private readonly postsService: PostsService,
    private readonly followsService: FollowsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Feed social' })
  async getFeed(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const followedIds = await this.followsService.getFollowedUserIds(user.id);
    return this.postsService.getFeed(user.id, followedIds, Number(page) || 1, Number(limit) || 10);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Sugestões de usuários para seguir' })
  async getSuggestions(@CurrentUser() user: User) {
    const followedIds = await this.followsService.getFollowedUserIds(user.id);
    return this.usersService.getSuggestions(user.id, followedIds);
  }
}
