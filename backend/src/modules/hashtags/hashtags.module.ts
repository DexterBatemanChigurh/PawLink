import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hashtag } from './entities/hashtag.entity';
import { Post } from '../posts/entities/post.entity';
import { HashtagsService } from './hashtags.service';
import { HashtagsController } from './hashtags.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hashtag, Post])],
  controllers: [HashtagsController],
  providers: [HashtagsService],
  exports: [HashtagsService],
})
export class HashtagsModule {}
