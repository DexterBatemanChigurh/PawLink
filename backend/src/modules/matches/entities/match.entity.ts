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
import { User } from '../../users/entities/user.entity';

export enum MatchStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ADOPTED = 'adopted',
  CANCELLED = 'cancelled',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  petId: string;

  @ManyToOne(() => Pet, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  interestedUserId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interestedUserId' })
  interestedUser: User;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  experience: string;

  @Column({ default: false })
  hasHouse: boolean;

  @Column({ default: false })
  hasOtherPets: boolean;

  @Column({ type: 'text', nullable: true })
  motivation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
