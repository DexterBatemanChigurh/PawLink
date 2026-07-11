import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Match } from '../matches/entities/match.entity';
import { Post } from '../posts/entities/post.entity';
import { Report } from '../reports/entities/report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Pet, Match, Post, Report])],
  controllers: [AdminController],
})
export class AdminModule {}
