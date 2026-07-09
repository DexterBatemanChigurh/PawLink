import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimelineEvent } from './entities/timeline-event.entity';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { PetsService } from '../pets/pets.service';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelineEvent)
    private timelineRepository: Repository<TimelineEvent>,
    private petsService: PetsService,
  ) {}

  async create(petId: string, dto: CreateTimelineEventDto): Promise<TimelineEvent> {
    await this.petsService.findById(petId);
    const event = this.timelineRepository.create({ ...dto, petId });
    return this.timelineRepository.save(event);
  }

  async findByPet(petId: string): Promise<TimelineEvent[]> {
    await this.petsService.findById(petId);
    return this.timelineRepository.find({
      where: { petId },
      order: { eventDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TimelineEvent> {
    const event = await this.timelineRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Evento não encontrado');
    return event;
  }

  async update(id: string, data: Partial<TimelineEvent>): Promise<TimelineEvent> {
    const event = await this.findOne(id);
    Object.assign(event, data);
    return this.timelineRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.timelineRepository.remove(event);
  }
}
