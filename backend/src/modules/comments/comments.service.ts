import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private postsService: PostsService,
    private notificationsService: NotificationsService,
  ) {}

  async create(postId: string, userId: string, dto: CreateCommentDto): Promise<Comment> {
    if (dto.parentId) {
      const parent = await this.commentsRepository.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Comentário pai não encontrado');
    }

    const comment = this.commentsRepository.create({
      postId,
      userId,
      content: dto.content,
      ...(dto.parentId ? { parentId: dto.parentId } : {}),
    });

    const saved = await this.commentsRepository.save(comment);

    const post = await this.postsService.findById(postId);
    if (post.authorId !== userId) {
      await this.notificationsService.create({
        userId: post.authorId,
        type: NotificationType.COMMENT,
        message: `Comentou no seu post: ${dto.content.substring(0, 80)}${dto.content.length > 80 ? '...' : ''}`,
        referenceId: postId,
        referenceType: 'post',
      });
    }

    return saved;
  }

  async findByPost(postId: string): Promise<Comment[]> {
    const comments = await this.commentsRepository.find({
      where: { postId, parentId: IsNull() },
      relations: { replies: { user: true } },
      order: { createdAt: 'DESC' },
    });

    return comments;
  }

  async update(id: string, userId: string, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.userId !== userId) throw new ForbiddenException('Você não pode editar este comentário');
    comment.content = dto.content;
    return this.commentsRepository.save(comment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.userId !== userId) throw new ForbiddenException('Você não pode remover este comentário');
    await this.commentsRepository.remove(comment);
  }
}
