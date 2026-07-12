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
import { Pet } from '../../pets/entities/pet.entity';

export enum PostType {
  TIP = 'tip',
  PROMOTION = 'promotion',
  EVENT = 'event',
  ADOPTION_DRIVE = 'adoption_drive',
  UPDATE = 'update',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  authorId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array', nullable: true })
  media: string[];

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.UPDATE,
  })
  type: PostType;

  @Column({ nullable: true })
  petId: string;

  @ManyToOne(() => Pet, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column({ nullable: true })
  sharedPostId: string;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sharedPostId' })
  sharedPost: Post;

  @Column({ select: false, insert: false, update: false, nullable: true })
  commentCount: number;

  @Column({ select: false, insert: false, update: false, nullable: true })
  sharesCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
