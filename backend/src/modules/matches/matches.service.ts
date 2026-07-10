import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus } from './entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { PetsService } from '../pets/pets.service';
import { PetStatus } from '../pets/entities/pet.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    private petsService: PetsService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    petId: string,
    userId: string,
    dto: CreateMatchDto,
  ): Promise<Match> {
    await this.petsService.findById(petId);

    const existing = await this.matchesRepository.findOne({
      where: { petId, interestedUserId: userId },
    });
    if (existing) {
      throw new ConflictException('Você já manifestou interesse neste pet');
    }

    const match = this.matchesRepository.create({
      petId,
      interestedUserId: userId,
      message: dto.message,
      phone: dto.phone,
    });

    const saved = await this.matchesRepository.save(match);

    const pet = await this.petsService.findById(petId);
    if (pet.ownerId !== userId) {
      await this.notificationsService.create({
        userId: pet.ownerId,
        type: NotificationType.MATCH_REQUEST,
        message: `${match.interestedUser.name} quer adotar ${pet.name}`,
        referenceId: saved.id,
        referenceType: 'match',
      });
    }

    return saved;
  }

  async findById(id: string): Promise<Match> {
    const match = await this.matchesRepository.findOne({ where: { id } });
    if (!match) throw new NotFoundException('Match não encontrado');
    return match;
  }

  async findByUser(userId: string): Promise<Match[]> {
    return this.matchesRepository.find({
      where: { interestedUserId: userId },
      relations: { pet: { owner: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findByPetOwner(ownerId: string): Promise<Match[]> {
    const pets = await this.petsService.findByOwner(ownerId);
    const petIds = pets.map((p) => p.id);
    if (petIds.length === 0) return [];

    return this.matchesRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.pet', 'pet')
      .leftJoinAndSelect('match.interestedUser', 'interestedUser')
      .where('match.petId IN (:...petIds)', { petIds })
      .orderBy('match.createdAt', 'DESC')
      .getMany();
  }

  async findActiveForUser(userId: string): Promise<Match[]> {
    const asInterested = await this.matchesRepository.find({
      where: [
        { interestedUserId: userId, status: MatchStatus.ACCEPTED },
        { interestedUserId: userId, status: MatchStatus.ADOPTED },
      ],
      relations: { pet: { owner: true } },
      order: { updatedAt: 'DESC' },
    });

    const petIds = (await this.petsService.findByOwner(userId)).map(
      (p) => p.id,
    );
    if (petIds.length === 0) return asInterested;

    const asOwner = await this.matchesRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.pet', 'pet')
      .leftJoinAndSelect('match.interestedUser', 'interestedUser')
      .where('match.petId IN (:...petIds)', { petIds })
      .andWhere('(match.status = :accepted OR match.status = :adopted)', {
        accepted: MatchStatus.ACCEPTED,
        adopted: MatchStatus.ADOPTED,
      })
      .orderBy('match.updatedAt', 'DESC')
      .getMany();

    const seen = new Set<string>();
    return [...asOwner, ...asInterested].filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  async findAll(): Promise<Match[]> {
    return this.matchesRepository.find({
      relations: { pet: true, interestedUser: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByPet(petId: string): Promise<Match[]> {
    await this.petsService.findById(petId);
    return this.matchesRepository.find({
      where: { petId },
      relations: { interestedUser: true },
      order: { createdAt: 'DESC' },
    });
  }

  async removeWithOwner(id: string, userId: string): Promise<void> {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: { pet: true, interestedUser: true },
    });
    if (!match) throw new NotFoundException('Match não encontrado');

    const isOwner = match.pet.ownerId === userId;
    const isInterested = match.interestedUserId === userId;
    if (!isOwner && !isInterested) {
      throw new ForbiddenException('Você não participa deste match');
    }

    await this.matchesRepository.remove(match);
  }

  async updateStatus(
    id: string,
    userId: string,
    dto: UpdateMatchDto,
  ): Promise<Match> {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: { pet: true },
    });
    if (!match) throw new NotFoundException('Match não encontrado');

    const pet = await this.petsService.findById(match.petId);
    if (pet.ownerId !== userId) {
      throw new ForbiddenException(
        'Apenas o tutor do pet pode aceitar/rejeitar',
      );
    }

    if (dto.status === MatchStatus.ADOPTED) {
      await this.petsService.update(match.petId, {
        status: PetStatus.ADOPTED,
        available: false,
        deletedAt: new Date(),
      });
    }

    match.status = dto.status;
    const saved = await this.matchesRepository.save(match);

    if (dto.status === MatchStatus.ACCEPTED) {
      await this.notificationsService.create({
        userId: match.interestedUserId,
        type: NotificationType.MATCH_ACCEPTED,
        message: `Seu interesse em ${pet.name} foi aceito!`,
        referenceId: saved.id,
        referenceType: 'match',
      });
    } else if (dto.status === MatchStatus.ADOPTED) {
      await this.notificationsService.create({
        userId: match.interestedUserId,
        type: NotificationType.MATCH_ADOPTED,
        message: `Parabéns! ${pet.name} foi adotado por você!`,
        referenceId: saved.id,
        referenceType: 'match',
      });
    }

    return saved;
  }
}
