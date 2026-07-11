import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private bookmarksRepository: Repository<Bookmark>,
  ) {}

  async add(userId: string, postId: string): Promise<Bookmark> {
    const existing = await this.bookmarksRepository.findOne({ where: { userId, postId } });
    if (existing) throw new ConflictException('Post já salvo');
    const bookmark = this.bookmarksRepository.create({ userId, postId });
    return this.bookmarksRepository.save(bookmark);
  }

  async remove(userId: string, postId: string): Promise<void> {
    const existing = await this.bookmarksRepository.findOne({ where: { userId, postId } });
    if (!existing) throw new NotFoundException('Bookmark não encontrado');
    await this.bookmarksRepository.remove(existing);
  }

  async findByUser(userId: string): Promise<Bookmark[]> {
    return this.bookmarksRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async isBookmarked(userId: string, postId: string): Promise<boolean> {
    const existing = await this.bookmarksRepository.findOne({ where: { userId, postId } });
    return !!existing;
  }
}
