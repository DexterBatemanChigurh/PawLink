import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';

export enum TimelineEventType {
  BIRTH = 'birth',
  RESCUE = 'rescue',
  VACCINE = 'vaccine',
  CASTRATION = 'castration',
  EXAM = 'exam',
  SURGERY = 'surgery',
  ADOPTION = 'adoption',
  TREATMENT = 'treatment',
  MEDICATION = 'medication',
  WEIGHT = 'weight',
  MICROCHIP = 'microchip',
  CHECKUP = 'checkup',
  OTHER = 'other',
}

@Entity('timeline_events')
export class TimelineEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TimelineEventType })
  type: TimelineEventType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  eventDate: string;

  @Column({ nullable: true })
  vetName: string;

  @Column({ nullable: true })
  clinicName: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  petId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
