import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, In } from 'typeorm';
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

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      role: (role ?? 'user') as UserRole,
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

  async getSuggestions(currentUserId: string, followedIds: string[]): Promise<User[]> {
    const publicRoles = ['ong', 'veterinary', 'petshop', 'independent_rescuer'];
    const excludeIds = [currentUserId, ...followedIds];

    return this.usersRepository.find({
      where: {
        id: Not(In(excludeIds)),
        role: In(publicRoles),
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }
}
