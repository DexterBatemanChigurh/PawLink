import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { PushSubscriptionsService } from '../push-subscriptions/push-subscriptions.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private pushService: PushSubscriptionsService,
  ) {}

  async create(dto: {
    userId: string;
    type: NotificationType;
    message: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create(dto);
    const saved = await this.notificationsRepository.save(notification);

    this.pushService.sendToUser(dto.userId, {
      title: 'PawLink',
      body: dto.message,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: '/', notificationId: saved.id },
    });

    return saved;
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationsRepository.update({ id, userId }, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, read: false },
      { read: true },
    );
  }
}
