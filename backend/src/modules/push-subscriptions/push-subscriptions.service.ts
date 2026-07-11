import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';

@Injectable()
export class PushSubscriptionsService implements OnModuleInit {
  constructor(
    @InjectRepository(PushSubscription)
    private readonly repo: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('app.vapidPublicKey');
    const privateKey = this.configService.get<string>('app.vapidPrivateKey');
    const email = this.configService.get<string>('app.vapidEmail');
    if (publicKey && privateKey) {
      webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
    }
  }

  getVapidPublicKey(): string {
    return this.configService.get<string>('app.vapidPublicKey') || '';
  }

  async subscribe(
    userId: string,
    dto: { endpoint: string; p256dh: string; auth: string },
  ): Promise<void> {
    const existing = await this.repo.findOne({
      where: { userId, endpoint: dto.endpoint },
    });
    if (existing) {
      await this.repo.update(existing.id, {
        p256dh: dto.p256dh,
        auth: dto.auth,
      });
      return;
    }
    const sub = this.repo.create({ userId, ...dto });
    await this.repo.save(sub);
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.repo.delete({ userId, endpoint });
  }

  async findByUser(userId: string): Promise<PushSubscription[]> {
    return this.repo.find({ where: { userId } });
  }

  async sendToUser(userId: string, payload: { title: string; body: string; icon?: string; badge?: string; data?: Record<string, any> }): Promise<void> {
    const subs = await this.repo.find({ where: { userId } });
    if (!subs.length) return;

    const json = JSON.stringify(payload);
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          json,
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await this.repo.delete(sub.id);
        }
      }
    }
  }
}
