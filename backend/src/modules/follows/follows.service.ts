import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private followsRepository: Repository<Follow>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async follow(followerId: string, targetUserId: string): Promise<Follow> {
    if (followerId === targetUserId) {
      throw new ConflictException('Você não pode seguir a si mesmo');
    }

    await this.usersService.findById(targetUserId);

    const existing = await this.followsRepository.findOne({
      where: { followerId, targetUserId },
    });
    if (existing) {
      throw new ConflictException('Você já segue este usuário');
    }

    const follow = this.followsRepository.create({ followerId, targetUserId });
    const saved = await this.followsRepository.save(follow);

    const follower = await this.usersService.findById(followerId);
    await this.notificationsService.create({
      userId: targetUserId,
      type: NotificationType.FOLLOW,
      message: `${follower.name} começou a seguir você`,
      referenceId: followerId,
      referenceType: 'user',
    });

    return saved;
  }

  async unfollow(followerId: string, targetUserId: string): Promise<void> {
    const follow = await this.followsRepository.findOne({
      where: { followerId, targetUserId },
    });
    if (!follow) {
      throw new NotFoundException('Você não segue este usuário');
    }
    await this.followsRepository.remove(follow);
  }

  async getFollowers(userId: string): Promise<Follow[]> {
    return this.followsRepository.find({
      where: { targetUserId: userId },
      relations: { follower: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getFollowing(userId: string): Promise<Follow[]> {
    return this.followsRepository.find({
      where: { followerId: userId },
      relations: { targetUser: true },
      order: { createdAt: 'DESC' },
    });
  }

  async isFollowing(followerId: string, targetUserId: string): Promise<boolean> {
    const follow = await this.followsRepository.findOne({
      where: { followerId, targetUserId },
    });
    return !!follow;
  }

  async getFollowedUserIds(userId: string): Promise<string[]> {
    const follows = await this.followsRepository.find({
      where: { followerId: userId },
    });
    return follows.map((f) => f.targetUserId);
  }
}
