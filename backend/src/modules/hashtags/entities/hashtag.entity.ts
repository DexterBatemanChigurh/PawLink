import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('hashtags')
export class Hashtag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  name: string;

  @Column({ type: 'int', default: 0 })
  postCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
