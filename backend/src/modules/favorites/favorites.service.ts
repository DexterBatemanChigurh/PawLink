import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
  ) {}

  async add(userId: string, petId: string): Promise<Favorite> {
    const existing = await this.favoritesRepository.findOne({ where: { userId, petId } });
    if (existing) throw new ConflictException('Pet já favoritado');
    const favorite = this.favoritesRepository.create({ userId, petId });
    return this.favoritesRepository.save(favorite);
  }

  async remove(userId: string, petId: string): Promise<void> {
    const existing = await this.favoritesRepository.findOne({ where: { userId, petId } });
    if (!existing) throw new NotFoundException('Favorito não encontrado');
    await this.favoritesRepository.remove(existing);
  }

  async findByUser(userId: string): Promise<Favorite[]> {
    return this.favoritesRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async isFavorited(userId: string, petId: string): Promise<boolean> {
    const existing = await this.favoritesRepository.findOne({ where: { userId, petId } });
    return !!existing;
  }
}
