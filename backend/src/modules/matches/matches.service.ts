import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
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
    const pet = await this.petsService.findById(petId);

    if (pet.ownerId === userId) {
      throw new ForbiddenException('Você não pode manifestar interesse no seu próprio pet');
    }

    const existing = await this.matchesRepository.findOne({
      where: {
        petId,
        interestedUserId: userId,
        status: Not(In([MatchStatus.CANCELLED, MatchStatus.REJECTED])),
      },
    });
    if (existing) {
      throw new ConflictException('Você já manifestou interesse neste pet');
    }

    const taken = await this.matchesRepository.findOne({
      where: [
        { petId, status: MatchStatus.REVIEWING },
        { petId, status: MatchStatus.ACCEPTED },
        { petId, status: MatchStatus.ADOPTED },
      ],
    });
    if (taken) {
      throw new ConflictException('Este pet já está em processo de adoção');
    }

    const match = this.matchesRepository.create({
      petId,
      interestedUserId: userId,
      message: dto.message,
      phone: dto.phone,
      experience: dto.experience,
      hasHouse: dto.hasHouse,
      hasOtherPets: dto.hasOtherPets,
      motivation: dto.motivation,
    });

    const saved = await this.matchesRepository.save(match);

    const reloaded = await this.matchesRepository.findOne({
      where: { id: saved.id },
    });

    if (pet.ownerId !== userId && reloaded) {
      await this.notificationsService.create({
        userId: pet.ownerId,
        type: NotificationType.MATCH_REQUEST,
        message: `${reloaded.interestedUser?.name || 'Alguém'} quer adotar ${pet.name}`,
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
        { interestedUserId: userId, status: MatchStatus.REVIEWING },
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
      .andWhere('(match.status = :reviewing OR match.status = :accepted OR match.status = :adopted)', {
        reviewing: MatchStatus.REVIEWING,
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
      throw new ForbiddenException('Apenas o tutor do pet pode alterar status');
    }

    if (
      dto.status === MatchStatus.ACCEPTED ||
      dto.status === MatchStatus.ADOPTED
    ) {
      const existingTaken = await this.matchesRepository.findOne({
        where: [
          { petId: match.petId, status: MatchStatus.REVIEWING },
          { petId: match.petId, status: MatchStatus.ACCEPTED },
          { petId: match.petId, status: MatchStatus.ADOPTED },
        ],
      });
      if (existingTaken && existingTaken.id !== id) {
        throw new ConflictException(
          'Este pet já está em processo de adoção por outro usuário',
        );
      }
    }

    if (dto.status === MatchStatus.ACCEPTED) {
      match.status = MatchStatus.ACCEPTED;
      await this.matchesRepository.save(match);

      await this.matchesRepository.update(
        {
          petId: match.petId,
          id: Not(match.id),
          status: In([MatchStatus.PENDING, MatchStatus.REVIEWING]),
        },
        { status: MatchStatus.REJECTED },
      );

      await this.petsService.update(match.petId, {
        status: PetStatus.RESERVED,
        available: false,
      });

      await this.notificationsService.create({
        userId: match.interestedUserId,
        type: NotificationType.MATCH_ACCEPTED,
        message: `Seu interesse em ${pet.name} foi aceito!`,
        referenceId: match.id,
        referenceType: 'match',
      });

      const allMatches = await this.matchesRepository.find({
        where: { petId: match.petId },
      });

      for (const rm of allMatches) {
        if (rm.id === match.id) continue;
        if (rm.status === MatchStatus.REJECTED && rm.interestedUserId !== match.interestedUserId) {
          await this.notificationsService.create({
            userId: rm.interestedUserId,
            type: NotificationType.MATCH_REJECTED,
            message: `O pet ${pet.name} foi adotado por outro candidato`,
            referenceId: rm.id,
            referenceType: 'match',
          });
        }
      }

      return this.matchesRepository.findOne({ where: { id } }) as Promise<Match>;
    }

    if (dto.status === MatchStatus.ADOPTED) {
      await this.petsService.update(match.petId, {
        status: PetStatus.ADOPTED,
        available: false,
        deletedAt: new Date(),
      });

      match.status = MatchStatus.ADOPTED;
      const saved = await this.matchesRepository.save(match);

      await this.notificationsService.create({
        userId: match.interestedUserId,
        type: NotificationType.MATCH_ADOPTED,
        message: `Parabéns! ${pet.name} foi adotado por você!`,
        referenceId: saved.id,
        referenceType: 'match',
      });

      return saved;
    }

    match.status = dto.status;
    const saved = await this.matchesRepository.save(match);

    if (dto.status === MatchStatus.REVIEWING) {
      await this.notificationsService.create({
        userId: match.interestedUserId,
        type: NotificationType.MATCH_REQUEST,
        message: `Seu interesse em ${pet.name} está em análise`,
        referenceId: saved.id,
        referenceType: 'match',
      });
    } else if (dto.status === MatchStatus.REJECTED) {
      await this.notificationsService.create({
        userId: match.interestedUserId,
        type: NotificationType.MATCH_REJECTED,
        message: `Seu interesse em ${pet.name} foi recusado`,
        referenceId: saved.id,
        referenceType: 'match',
      });
    }

    return saved;
  }

  async cancel(id: string, userId: string): Promise<void> {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: { pet: true },
    });
    if (!match) throw new NotFoundException('Match não encontrado');

    if (match.interestedUserId !== userId) {
      throw new ForbiddenException('Você não pode cancelar este interesse');
    }

    if (match.status !== MatchStatus.PENDING && match.status !== MatchStatus.REVIEWING) {
      throw new ConflictException('Não é possível cancelar um interesse que já foi respondido');
    }

    match.status = MatchStatus.CANCELLED;
    await this.matchesRepository.save(match);
  }
}
