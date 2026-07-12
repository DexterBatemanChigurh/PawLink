import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Post, PostType } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { HashtagsService } from '../hashtags/hashtags.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private hashtagsService: HashtagsService,
    private orgService: OrganizationsService,
  ) {}

  async create(dto: CreatePostDto, authorId: string): Promise<Post> {
    if (dto.organizationId) {
      const org = await this.orgService.findById(dto.organizationId);
      if (org.ownerId !== authorId) {
        throw new ForbiddenException('Você não é o proprietário desta organização');
      }
      if (org.status !== 'approved') {
        throw new ConflictException('Organização precisa estar aprovada para publicar');
      }
    }

    const post = this.postsRepository.create();
    post.content = dto.content;
    post.authorId = authorId;
    post.type = dto.type || PostType.UPDATE;
    if (dto.media) post.media = dto.media;
    if (dto.petId) post.petId = dto.petId;
    if (dto.organizationId) post.organizationId = dto.organizationId;
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
      where: { authorId: userId, organizationId: IsNull() },
      relations: {
        organization: true,
        sharedPost: { author: true, pet: true, sharedPost: { author: true, pet: true } },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrganization(orgId: string, page = 1, limit = 20): Promise<{ posts: Post[]; total: number }> {
    const [posts, total] = await this.postsRepository.findAndCount({
      where: { organizationId: orgId },
      relations: { sharedPost: { author: true, pet: true, sharedPost: { author: true, pet: true } } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { posts, total };
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
      .leftJoinAndSelect('post.organization', 'organization')
      .leftJoinAndSelect('post.sharedPost', 'sharedPost')
      .leftJoinAndSelect('sharedPost.author', 'sharedPostAuthor')
      .leftJoinAndSelect('sharedPost.pet', 'sharedPostPet');

    if (followedIds.length > 0) {
      query.where(
        `(
          author.role IN (:...publicRoles)
          OR post.authorId IN (:...followedIds)
          OR post.authorId = :userId
          OR post."organizationId" IS NOT NULL
        )`,
        { publicRoles, followedIds, userId },
      );
    } else {
      query.where(
        `(
          author.role IN (:...publicRoles)
          OR post.authorId = :userId
          OR post."organizationId" IS NOT NULL
        )`,
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
