import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { CreatePetDto } from './dto/create-pet.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
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
    const where: FindOptionsWhere<Pet> = {};

    if (filters.species) where.species = filters.species as any;
    if (filters.size) where.size = filters.size as any;
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

  async removeWithOwner(id: string, userId: string, userRole?: string): Promise<void> {
    const pet = await this.findById(id);
    if (pet.ownerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Você não é o tutor deste pet');
    }
    await this.petsRepository.remove(pet);
  }

  async findByOwner(ownerId: string): Promise<Pet[]> {
    return this.petsRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }
}
