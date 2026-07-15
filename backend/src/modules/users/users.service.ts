import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, role?: string): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const { role: dtoRole, status: dtoStatus, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...rest,
      role: (role ?? dtoRole ?? 'user') as UserRole,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { passwordResetToken: token } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  async updateAvatar(id: string, avatar: string): Promise<User> {
    const user = await this.findById(id);
    user.avatar = avatar;
    return this.usersRepository.save(user);
  }

  async updateCoverPhoto(id: string, coverPhoto: string): Promise<User> {
    const user = await this.findById(id);
    user.coverPhoto = coverPhoto;
    return this.usersRepository.save(user);
  }

  async updateSettings(
    id: string,
    settings: Partial<{ postVisibility: string; messagePrivacy: string; notificationPush: boolean }>,
  ): Promise<User> {
    const user = await this.findById(id);
    user.settings = { ...user.settings, ...settings };
    return this.usersRepository.save(user);
  }

  sanitizeUser(user: User): Omit<User, 'email' | 'password' | 'refreshToken' | 'passwordResetToken' | 'passwordResetExpires'> {
    const { email, password, refreshToken, passwordResetToken, passwordResetExpires, ...rest } = user;
    return rest;
  }

  async findAll(page = 1, limit = 20): Promise<{ users: Omit<User, 'email' | 'password' | 'refreshToken' | 'passwordResetToken' | 'passwordResetExpires'>[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      users: users.map((u) => this.sanitizeUser(u)),
      total,
    };
  }

  async findAllAdmin(page = 1, limit = 20, q?: string, status?: string): Promise<{ users: Omit<User, 'email' | 'password' | 'refreshToken' | 'passwordResetToken' | 'passwordResetExpires'>[]; total: number }> {
    const where: any = {};
    if (q) {
      where.name = ILike(`%${q}%`);
    }
    if (status) {
      where.status = status;
    }
    const [users, total] = await this.usersRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      users: users.map((u) => this.sanitizeUser(u)),
      total,
    };
  }

  async search(query: string, page = 1, limit = 20): Promise<{ users: Omit<User, 'email' | 'password' | 'refreshToken' | 'passwordResetToken' | 'passwordResetExpires'>[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      where: { name: ILike(`%${query}%`) },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      users: users.map((u) => this.sanitizeUser(u)),
      total,
    };
  }

  async getSuggestions(
    currentUserId: string,
    followedIds: string[],
    mutualFollowIds: string[],
    userCity?: string,
    userState?: string,
  ): Promise<User[]> {
    const publicRoles = ['ong', 'veterinary', 'petshop', 'independent_rescuer', 'user'];
    const excludeIds = [currentUserId, ...followedIds];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const mutualSet = new Set(mutualFollowIds);

    const candidates = await this.usersRepository
      .createQueryBuilder('u')
      .leftJoin('follows', 'f', 'f.targetUserId = u.id')
      .leftJoin('posts', 'p', 'p.authorId = u.id AND p.createdAt >= :weekAgo', { weekAgo })
      .where('u.id NOT IN (:...excludeIds)', { excludeIds })
      .andWhere('u.role IN (:...publicRoles)', { publicRoles })
      .groupBy('u.id')
      .addSelect('COUNT(DISTINCT f.id)', 'follower_count')
      .addSelect('COUNT(DISTINCT p.id)', 'recent_post_count')
      .getRawMany();

    const scored = candidates.map((c: any) => {
      let score = 0;
      if (userCity && c.u_city === userCity) score += 40;
      else if (userState && c.u_state === userState) score += 15;
      if (mutualSet.has(c.u_id)) score += 30;
      score += Math.min(Number(c.follower_count) || 0, 50);
      score += Math.min(Number(c.recent_post_count) || 0, 20);
      return { user: c, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const topIds = scored.slice(0, 5).map((s) => s.user.u_id);

    if (topIds.length === 0) return [];

    const ordered = await this.usersRepository
      .createQueryBuilder('u')
      .where('u.id IN (:...topIds)', { topIds })
      .getMany();

    return topIds.map((id) => ordered.find((u) => u.id === id)).filter(Boolean) as User[];
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    if (status === UserStatus.BLOCKED) {
      user.refreshToken = '';
    }
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }
}
