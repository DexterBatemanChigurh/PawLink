import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { PostsModule } from '../posts/posts.module';
import { FollowsModule } from '../follows/follows.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PostsModule, FollowsModule, UsersModule],
  controllers: [FeedController],
})
export class FeedModule {}
