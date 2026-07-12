import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reporterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column()
  reportedUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportedUserId' })
  reportedUser: User;

  @Column({ nullable: true })
  reportedPostId: string;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportedPostId' })
  reportedPost: Post;

  @Column()
  reason: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
