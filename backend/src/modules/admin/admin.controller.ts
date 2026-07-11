import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { Post } from '../posts/entities/post.entity';
import { Report } from '../reports/entities/report.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Estatísticas do dashboard' })
  async getDashboard(@CurrentUser() user: User) {
    if (user.role !== 'admin') throw new ForbiddenException('Apenas administradores');
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalUsers, usersThisMonth, usersLastMonth] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { createdAt: MoreThanOrEqual(firstOfMonth) } }),
      this.usersRepository.count({ where: { createdAt: Between(firstOfLastMonth, firstOfMonth) } }),
    ]);

    const [totalPets, petsThisMonth, petsLastMonth] = await Promise.all([
      this.petsRepository.count(),
      this.petsRepository.count({ where: { createdAt: MoreThanOrEqual(firstOfMonth) } }),
      this.petsRepository.count({ where: { createdAt: Between(firstOfLastMonth, firstOfMonth) } }),
    ]);

    const [totalMatches, matchesThisMonth, matchesLastMonth] = await Promise.all([
      this.matchesRepository.count(),
      this.matchesRepository.count({ where: { createdAt: MoreThanOrEqual(firstOfMonth) } }),
      this.matchesRepository.count({ where: { createdAt: Between(firstOfLastMonth, firstOfMonth) } }),
    ]);

    const adoptionsCompleted = await this.matchesRepository.count({ where: { status: MatchStatus.ADOPTED } });

    const [totalPosts] = await Promise.all([
      this.postsRepository.count(),
    ]);

    const [totalReports, pendingReports] = await Promise.all([
      this.reportsRepository.count(),
      this.reportsRepository.count({ where: { status: 'pending' } }),
    ]);

    const calcGrowth = (current: number, previous: number) =>
      previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;

    return {
      totalUsers,
      totalPets,
      totalMatches,
      totalPosts,
      totalReports,
      pendingReports,
      adoptionsCompleted,
      usersGrowth: calcGrowth(usersThisMonth, usersLastMonth),
      petsGrowth: calcGrowth(petsThisMonth, petsLastMonth),
      matchesGrowth: calcGrowth(matchesThisMonth, matchesLastMonth),
    };
  }
}
