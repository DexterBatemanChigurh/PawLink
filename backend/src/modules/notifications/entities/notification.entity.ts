import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  FOLLOW = 'follow',
  REACTION = 'reaction',
  COMMENT = 'comment',
  MATCH_REQUEST = 'match_request',
  MATCH_ACCEPTED = 'match_accepted',
  MATCH_REJECTED = 'match_rejected',
  MATCH_ADOPTED = 'match_adopted',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  referenceType: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
