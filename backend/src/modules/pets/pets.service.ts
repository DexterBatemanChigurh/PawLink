import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, IsNull, Not } from 'typeorm';
import { Pet, PetSpecies, PetSize } from './entities/pet.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
    private usersService: UsersService,
  ) {}

  async create(dto: CreatePetDto, ownerId: string): Promise<Pet> {
    const pet = this.petsRepository.create({
      ...dto,
      ownerId,
    });
    return this.petsRepository.save(pet);
  }

  async findById(id: string): Promise<Pet> {
    const pet = await this.petsRepository.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!pet) {
      throw new NotFoundException('Pet não encontrado');
    }
    return pet;
  }

  async findAll(filters: {
    species?: string;
    size?: string;
    city?: string;
    state?: string;
    available?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ pets: Pet[]; total: number }> {
    const where: FindOptionsWhere<Pet> = {
      deletedAt: IsNull(),
    };

    if (filters.species) where.species = filters.species as PetSpecies;
    if (filters.size) where.size = filters.size as PetSize;
    if (filters.city) where.city = ILike(`%${filters.city}%`);
    if (filters.state) where.state = ILike(`%${filters.state}%`);
    if (filters.available !== undefined) where.available = filters.available;

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [pets, total] = await this.petsRepository.findAndCount({
      where,
      relations: { owner: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { pets, total };
  }

  async update(id: string, data: Partial<Pet>): Promise<Pet> {
    const pet = await this.findById(id);
    Object.assign(pet, data);
    return this.petsRepository.save(pet);
  }

  async updateWithOwner(id: string, data: Partial<Pet>, userId: string, userRole?: string): Promise<Pet> {
    const pet = await this.findById(id);
    if (pet.ownerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Você não é o tutor deste pet');
    }
    Object.assign(pet, data);
    return this.petsRepository.save(pet);
  }

  async remove(id: string): Promise<void> {
    const pet = await this.findById(id);
    await this.petsRepository.remove(pet);
  }

  async softRemoveWithOwner(id: string, userId: string, userRole?: string): Promise<void> {
    const pet = await this.findById(id);
    if (pet.ownerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Você não é o tutor deste pet');
    }
    await this.petsRepository.remove(pet);
  }

  async search(
    q: string,
    species?: string,
    city?: string,
    page = 1,
    limit = 20,
  ): Promise<{ pets: Pet[]; total: number }> {
    const where: FindOptionsWhere<Pet> = {
      deletedAt: IsNull(),
      name: ILike(`%${q}%`),
    };
    if (species) where.species = species as PetSpecies;
    if (city) where.city = ILike(`%${city}%`);

    const [pets, total] = await this.petsRepository.findAndCount({
      where,
      relations: { owner: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { pets, total };
  }

  async recommendations(userId: string, limit = 10): Promise<Pet[]> {
    let user: User;
    try {
      user = await this.usersService.findById(userId);
    } catch {
      return this.petsRepository.find({
        where: { deletedAt: IsNull(), available: true },
        relations: { owner: true },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    }

    const where: FindOptionsWhere<Pet> = {
      deletedAt: IsNull(),
      available: true,
      ownerId: Not(userId),
    };

    return this.petsRepository.find({
      where,
      relations: { owner: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByOwner(ownerId: string): Promise<Pet[]> {
    return this.petsRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }
}
