import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Hashtag } from './entities/hashtag.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class HashtagsService {
  constructor(
    @InjectRepository(Hashtag)
    private hashtagsRepository: Repository<Hashtag>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async extractAndSave(content: string, postId: string): Promise<void> {
    const tags = content.match(/#(\w+)/g);
    if (!tags) return;

    const names = tags.map(t => t.slice(1).toLowerCase());
    const uniqueNames = [...new Set(names)];

    for (const name of uniqueNames) {
      const existing = await this.hashtagsRepository.findOne({ where: { name } });
      if (existing) {
        existing.postCount += 1;
        await this.hashtagsRepository.save(existing);
      } else {
        await this.hashtagsRepository.save(
          this.hashtagsRepository.create({ name, postCount: 1 }),
        );
      }
    }
  }

  async findTrending(limit = 10): Promise<Hashtag[]> {
    return this.hashtagsRepository.find({
      order: { postCount: 'DESC' },
      take: limit,
    });
  }

  async findPostsByHashtag(
    name: string,
    page = 1,
    limit = 20,
  ): Promise<{ posts: Post[]; total: number }> {
    const [posts, total] = await this.postsRepository.findAndCount({
      where: { content: ILike(`%#${name}%`) },
      relations: { author: true, pet: true, sharedPost: { author: true, pet: true } },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { posts, total };
  }
}
