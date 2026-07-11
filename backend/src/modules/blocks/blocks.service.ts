import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private blocksRepository: Repository<Block>,
  ) {}

  async block(blockerId: string, blockedId: string): Promise<Block> {
    if (blockerId === blockedId) throw new ConflictException('Você não pode bloquear a si mesmo');
    const existing = await this.blocksRepository.findOne({ where: { blockerId, blockedId } });
    if (existing) throw new ConflictException('Usuário já bloqueado');
    const block = this.blocksRepository.create({ blockerId, blockedId });
    return this.blocksRepository.save(block);
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const existing = await this.blocksRepository.findOne({ where: { blockerId, blockedId } });
    if (!existing) throw new NotFoundException('Usuário não está bloqueado');
    await this.blocksRepository.remove(existing);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const existing = await this.blocksRepository.findOne({ where: { blockerId, blockedId } });
    return !!existing;
  }
}
