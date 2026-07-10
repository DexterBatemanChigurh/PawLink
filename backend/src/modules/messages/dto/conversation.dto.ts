export class ConversationDto {
  matchId: string;
  petName: string;
  petPhoto: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  lastMessage: string | null;
  lastMessageAt: Date;
  unreadCount: number;
  matchStatus: string;
}
