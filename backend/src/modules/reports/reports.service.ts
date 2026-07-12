import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private notificationsService: NotificationsService,
  ) {}

  async create(reporterId: string, reportedUserId: string, dto: CreateReportDto, reportedPostId?: string): Promise<Report> {
    const report = this.reportsRepository.create({
      reporterId,
      reportedUserId,
      ...(reportedPostId ? { reportedPostId } : {}),
      reason: dto.reason,
      description: dto.description,
    });
    const saved = await this.reportsRepository.save(report);

    // Notify all admins about the new report
    const reporter = await this.usersRepository.findOne({ where: { id: reporterId } });
    const admins = await this.usersRepository.find({ where: { role: UserRole.ADMIN } });
    const reportedUser = await this.usersRepository.findOne({ where: { id: reportedUserId } });
    const target = reportedPostId
      ? `o post de ${reportedUser?.name || 'usuário'}`
      : `${reportedUser?.name || 'usuário'}`;
    for (const admin of admins) {
      this.notificationsService.create({
        userId: admin.id,
        type: NotificationType.REPORT,
        message: `Nova denúncia de ${reporter?.name || 'alguém'} contra ${target}`,
        referenceId: saved.id,
        referenceType: 'report',
      });
    }

    return saved;
  }

  async createForPost(reporterId: string, postId: string, dto: CreateReportDto): Promise<Report> {
    const post = await this.postsRepository.findOne({ where: { id: postId }, relations: { author: true } });
    if (!post) throw new NotFoundException('Post não encontrado');
    return this.create(reporterId, post.authorId, dto, postId);
  }

  async findAll(status?: string, page = 1, limit = 20): Promise<{ reports: Report[]; total: number }> {
    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await this.reportsRepository.findAndCount({
      where,
      relations: { reporter: true, reportedUser: true, reportedPost: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { reports, total };
  }

  async updateStatus(id: string, status: string, adminId: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report não encontrado');
    report.status = status;
    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedAt = new Date();
      report.resolvedBy = adminId;
    }
    return this.reportsRepository.save(report);
  }

  async resolve(id: string, adminId: string): Promise<Report> {
    return this.updateStatus(id, 'resolved', adminId);
  }

  async dismiss(id: string, adminId: string): Promise<Report> {
    return this.updateStatus(id, 'dismissed', adminId);
  }

  async countByStatus(status?: string): Promise<number> {
    const where: any = {};
    if (status) where.status = status;
    return this.reportsRepository.count({ where });
  }
}
