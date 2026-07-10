import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(dto: {
    userId: string;
    type: NotificationType;
    message: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create(dto);
    return this.notificationsRepository.save(notification);
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
