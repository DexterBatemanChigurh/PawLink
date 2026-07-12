import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostType } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { HashtagsService } from '../hashtags/hashtags.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private hashtagsService: HashtagsService,
  ) {}

  async create(dto: CreatePostDto, authorId: string): Promise<Post> {
    const post = this.postsRepository.create();
    post.content = dto.content;
    post.authorId = authorId;
    post.type = dto.type || PostType.UPDATE;
    if (dto.media) post.media = dto.media;
    if (dto.petId) post.petId = dto.petId;
    const saved = await this.postsRepository.save(post);
    if (dto.content) {
      await this.hashtagsService.extractAndSave(dto.content, saved.id);
    }
    return saved;
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: { sharedPost: { author: true, pet: true, sharedPost: { author: true, pet: true } } },
    });
    if (!post) throw new NotFoundException('Post não encontrado');
    return post;
  }

  async findByUser(userId: string): Promise<Post[]> {
    return this.postsRepository.find({
      where: { authorId: userId },
      relations: { sharedPost: { author: true, pet: true, sharedPost: { author: true, pet: true } } },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, userId: string, dto: CreatePostDto): Promise<Post> {
    const post = await this.findById(id);
    if (post.authorId !== userId) {
      throw new ForbiddenException('Você não pode editar este post');
    }
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.media !== undefined) post.media = dto.media;
    if (dto.type !== undefined) post.type = dto.type;
    if (dto.petId !== undefined) post.petId = dto.petId;
    return this.postsRepository.save(post);
  }

  async remove(id: string, userId: string, userRole?: string): Promise<void> {
    const post = await this.findById(id);
    if (post.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Você não pode remover este post');
    }
    await this.postsRepository.remove(post);
  }

  async share(postId: string, userId: string, content?: string): Promise<Post> {
    const original = await this.postsRepository.findOne({
      where: { id: postId },
    });
    if (!original) throw new NotFoundException('Post não encontrado');

    const post = this.postsRepository.create({
      authorId: userId,
      content: content || '',
      type: PostType.UPDATE,
      sharedPostId: postId,
    });
    return this.postsRepository.save(post);
  }

  async getFeed(userId: string, followedIds: string[], page = 1, limit = 10): Promise<{ posts: Post[]; total: number }> {
    const publicRoles = ['ong', 'veterinary', 'petshop', 'independent_rescuer', 'admin'];

    const query = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.pet', 'pet')
      .leftJoinAndSelect('post.sharedPost', 'sharedPost')
      .leftJoinAndSelect('sharedPost.author', 'sharedPostAuthor')
      .leftJoinAndSelect('sharedPost.pet', 'sharedPostPet');

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
      .addSelect(`(
        SELECT COUNT(*) FROM comments WHERE comments."postId" = post.id
      )`, 'post_commentCount')
      .addSelect(`(
        SELECT COUNT(*) FROM posts AS shares WHERE shares."sharedPostId" = post.id
      )`, 'post_sharesCount')
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { posts, total };
  }
}
