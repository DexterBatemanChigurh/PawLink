import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Message } from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationDto } from './dto/conversation.dto';
import { MatchesService } from '../matches/matches.service';
import { PetsService } from '../pets/pets.service';
import { MatchStatus } from '../matches/entities/match.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private matchesService: MatchesService,
    private petsService: PetsService,
  ) {}

  async send(dto: SendMessageDto, userId: string): Promise<Message> {
    const match = await this.matchesService.findById(dto.matchId);

    if (
      match.status !== MatchStatus.ACCEPTED &&
      match.status !== MatchStatus.ADOPTED
    ) {
      throw new ForbiddenException(
        'Só é possível enviar mensagens após o match ser aceito',
      );
    }

    const pet = await this.petsService.findById(match.petId);
    if (match.interestedUserId !== userId && pet.ownerId !== userId) {
      throw new ForbiddenException('Você não participa deste match');
    }

    const message = this.messagesRepository.create({
      matchId: dto.matchId,
      senderId: userId,
      content: dto.content,
    });
    return this.messagesRepository.save(message);
  }

  async findById(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: { sender: true },
    });
    if (!message) throw new NotFoundException('Mensagem não encontrada');
    return message;
  }

  async getConversations(userId: string): Promise<ConversationDto[]> {
    const matches = await this.matchesService.findActiveForUser(userId);

    const conversations = await Promise.all(
      matches.map(async (match) => {
        const lastMessage = await this.messagesRepository.findOne({
          where: { matchId: match.id },
          order: { createdAt: 'DESC' },
        });

        const unreadCount = await this.messagesRepository.count({
          where: {
            matchId: match.id,
            senderId: Not(userId),
            readAt: IsNull(),
          },
        });

        const pet = match.pet;
        const isOwner = pet.ownerId === userId;
        const otherUser = isOwner ? match.interestedUser : pet.owner;

        return {
          matchId: match.id,
          petName: pet.name,
          petPhoto: Array.isArray(pet.photos) ? pet.photos[0] || '' : '',
          otherUserId: otherUser.id,
          otherUserName: otherUser.name,
          otherUserAvatar: otherUser.avatar || '',
          lastMessage: lastMessage?.content || null,
          lastMessageAt: lastMessage?.createdAt || match.createdAt,
          unreadCount,
          matchStatus: match.status,
        } as ConversationDto;
      }),
    );

    conversations.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );

    return conversations;
  }

  async getMessages(matchId: string, userId: string): Promise<Message[]> {
    const match = await this.matchesService.findById(matchId);
    const pet = await this.petsService.findById(match.petId);

    if (match.interestedUserId !== userId && pet.ownerId !== userId) {
      throw new ForbiddenException('Você não participa deste match');
    }

    return this.messagesRepository.find({
      where: { matchId },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
    });
  }

  async markAsRead(matchId: string, userId: string): Promise<void> {
    await this.messagesRepository.update(
      { matchId, senderId: Not(userId), readAt: IsNull() },
      { readAt: new Date() },
    );
  }
}
