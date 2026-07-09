import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Match, MatchStatus } from '../matches/entities/match.entity';

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
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Estatísticas do dashboard' })
  async getDashboard() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalUsers, usersThisMonth, usersLastMonth] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { createdAt: MoreThanOrEqual(firstOfMonth) } }),
      this.usersRepository.count({ where: { createdAt: Between(firstOfLastMonth, firstOfMonth) as any } }),
    ]);

    const [totalPets, petsThisMonth, petsLastMonth] = await Promise.all([
      this.petsRepository.count(),
      this.petsRepository.count({ where: { createdAt: MoreThanOrEqual(firstOfMonth) } }),
      this.petsRepository.count({ where: { createdAt: Between(firstOfLastMonth, firstOfMonth) as any } }),
    ]);

    const [totalMatches, matchesThisMonth, matchesLastMonth] = await Promise.all([
      this.matchesRepository.count(),
      this.matchesRepository.count({ where: { createdAt: MoreThanOrEqual(firstOfMonth) } }),
      this.matchesRepository.count({ where: { createdAt: Between(firstOfLastMonth, firstOfMonth) as any } }),
    ]);

    const adoptionsCompleted = await this.matchesRepository.count({ where: { status: MatchStatus.ADOPTED } });

    const calcGrowth = (current: number, previous: number) =>
      previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;

    return {
      totalUsers,
      totalPets,
      totalMatches,
      adoptionsCompleted,
      usersGrowth: calcGrowth(usersThisMonth, usersLastMonth),
      petsGrowth: calcGrowth(petsThisMonth, petsLastMonth),
      matchesGrowth: calcGrowth(matchesThisMonth, matchesLastMonth),
    };
  }
}
