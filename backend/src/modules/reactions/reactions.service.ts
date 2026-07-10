import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction, ReactionType } from './entities/reaction.entity';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

const reactionLabels: Record<string, string> = {
  like: 'Curtiu',
  love: 'Amei',
  laugh: 'Haha',
  wow: 'Uau',
  sad: 'Triste',
  angry: 'Grr',
};

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private reactionsRepository: Repository<Reaction>,
    private postsService: PostsService,
    private notificationsService: NotificationsService,
  ) {}

  async upsert(postId: string, userId: string, type: ReactionType): Promise<{ action: 'created' | 'updated' | 'removed'; type: ReactionType | null }> {
    const existing = await this.reactionsRepository.findOne({
      where: { postId, userId },
    });

    if (existing) {
      if (existing.type === type) {
        await this.reactionsRepository.remove(existing);
        return { action: 'removed', type: null };
      }
      existing.type = type;
      await this.reactionsRepository.save(existing);
      return { action: 'updated', type: existing.type };
    }

    const reaction = this.reactionsRepository.create({ postId, userId, type });
    await this.reactionsRepository.save(reaction);

    const post = await this.postsService.findById(postId);
    if (post.authorId !== userId) {
      const label = reactionLabels[type] || 'Reagiu';
      await this.notificationsService.create({
        userId: post.authorId,
        type: NotificationType.REACTION,
        message: `${label} ao seu post`,
        referenceId: postId,
        referenceType: 'post',
      });
    }

    return { action: 'created', type };
  }

  async findByPost(postId: string): Promise<{
    counts: Record<string, number>;
    total: number;
    userReaction: ReactionType | null;
  }> {
    const reactions = await this.reactionsRepository.find({
      where: { postId },
    });

    const counts: Record<string, number> = {};
    for (const r of Object.values(ReactionType)) {
      counts[r] = 0;
    }
    for (const r of reactions) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }

    return {
      counts,
      total: reactions.length,
      userReaction: null,
    };
  }

  async findByPostForUser(postId: string, userId: string): Promise<{
    counts: Record<string, number>;
    total: number;
    userReaction: ReactionType | null;
  }> {
    const reactions = await this.reactionsRepository.find({
      where: { postId },
    });

    const counts: Record<string, number> = {};
    for (const r of Object.values(ReactionType)) {
      counts[r] = 0;
    }
    for (const r of reactions) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }

    const userReact = reactions.find((r) => r.userId === userId);

    return {
      counts,
      total: reactions.length,
      userReaction: userReact?.type || null,
    };
  }
}
