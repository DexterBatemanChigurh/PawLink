import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  async create(reporterId: string, reportedUserId: string, dto: CreateReportDto): Promise<Report> {
    const report = this.reportsRepository.create({
      reporterId,
      reportedUserId,
      reason: dto.reason,
      description: dto.description,
    });
    return this.reportsRepository.save(report);
  }

  async findAll(status?: string, page = 1, limit = 20): Promise<{ reports: Report[]; total: number }> {
    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await this.reportsRepository.findAndCount({
      where,
      relations: { reporter: true, reportedUser: true },
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
    report.resolvedAt = new Date();
    report.resolvedBy = adminId;
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
