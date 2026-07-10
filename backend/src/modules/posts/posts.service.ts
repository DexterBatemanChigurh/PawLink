import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostType } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async create(dto: CreatePostDto, authorId: string): Promise<Post> {
    const post = this.postsRepository.create();
    post.content = dto.content;
    post.authorId = authorId;
    post.type = dto.type || PostType.UPDATE;
    if (dto.media) post.media = dto.media;
    if (dto.petId) post.petId = dto.petId;
    return this.postsRepository.save(post);
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post não encontrado');
    return post;
  }

  async findByUser(userId: string): Promise<Post[]> {
    return this.postsRepository.find({
      where: { authorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findById(id);
    if (post.authorId !== userId) {
      throw new ForbiddenException('Você não pode remover este post');
    }
    await this.postsRepository.remove(post);
  }

  async getStories(): Promise<{ id: string; name: string; avatar: string | null; role: string }[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const raw = await this.postsRepository
      .createQueryBuilder('post')
      .select('post.authorId', 'id')
      .addSelect('"author"."name"', 'name')
      .addSelect('"author"."avatar"', 'avatar')
      .addSelect('"author"."role"', 'role')
      .innerJoin('post.author', 'author')
      .where('post.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('post.authorId')
      .addGroupBy('"author"."name"')
      .addGroupBy('"author"."avatar"')
      .addGroupBy('"author"."role"')
      .orderBy('MAX(post.createdAt)', 'DESC')
      .limit(12)
      .getRawMany();

    return raw.map((r: any) => ({
      id: r.id,
      name: r.name,
      avatar: r.avatar,
      role: r.role,
    }));
  }

  async getFeed(userId: string, followedIds: string[], page = 1, limit = 10): Promise<{ posts: Post[]; total: number }> {
    const publicRoles = ['ong', 'veterinary', 'petshop', 'independent_rescuer', 'admin'];

    const query = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.pet', 'pet');

    if (followedIds.length > 0) {
      query.where(
        `(
          author.role IN (:...publicRoles)
          OR post.authorId IN (:...followedIds)
          OR post.authorId = :userId
        )`,
        { publicRoles, followedIds, userId },
      );
    } else {
      query.where(
        `(author.role IN (:...publicRoles) OR post.authorId = :userId)`,
        { publicRoles, userId },
      );
    }

    const [posts, total] = await query
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { posts, total };
  }
}
