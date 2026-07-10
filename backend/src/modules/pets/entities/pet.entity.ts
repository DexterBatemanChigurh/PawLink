import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PetSpecies {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  RABBIT = 'rabbit',
  HAMSTER = 'hamster',
  OTHER = 'other',
}

export enum PetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  GIANT = 'giant',
}

export enum PetStatus {
  AVAILABLE = 'available',
  ADOPTED = 'adopted',
  IN_TREATMENT = 'in_treatment',
  QUARANTINED = 'quarantined',
  UNAVAILABLE = 'unavailable',
}

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PetSpecies,
  })
  species: PetSpecies;

  @Column({ nullable: true })
  breed: string;

  @Column({ nullable: true })
  color: string;

  @Column({
    type: 'enum',
    enum: PetSize,
    nullable: true,
  })
  size: PetSize;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ nullable: true })
  ageUnit: string;

  @Column({ default: false })
  castrated: boolean;

  @Column({ default: false })
  vaccinated: boolean;

  @Column({ nullable: true })
  temperament: string;

  @Column({ type: 'text', nullable: true })
  story: string;

  @Column({ type: 'text', nullable: true })
  personality: string;

  @Column({ nullable: true })
  specialNeeds: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @Column({ nullable: true })
  videoUrl: string;

  @Column({
    type: 'enum',
    enum: PetStatus,
    default: PetStatus.AVAILABLE,
  })
  status: PetStatus;

  @Column({ default: true })
  available: boolean;

  @Column({ type: 'int', default: 0 })
  compatibilityScore: number;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
