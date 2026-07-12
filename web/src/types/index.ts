export interface Organization {
  id: string
  name: string
  slug: string
  avatar?: string
  coverPhoto?: string
  description?: string
  mission?: string
  cnpj: string
  email?: string
  phone?: string
  website?: string
  city?: string
  state?: string
  status: 'pending' | 'approved' | 'rejected'
  verified: boolean
  ownerId: string
  owner?: User
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  status: string
  avatar?: string
  phone?: string
  bio?: string
  city?: string
  state?: string
  createdAt: string
}

export interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  color?: string
  size?: string
  age?: number
  ageUnit?: string
  castrated: boolean
  vaccinated: boolean
  temperament?: string
  story?: string
  personality?: string
  specialNeeds?: string
  city?: string
  state?: string
  photos: string[]
  status: string
  available: boolean
  ownerId: string
  owner?: User
  organizationId?: string
  organization?: Organization
  createdAt: string
}

export interface TimelineEvent {
  id: string
  petId: string
  type: string
  title: string
  description?: string
  eventDate: string
  vetName?: string
  clinicName?: string
  createdAt: string
}

export interface Message {
  id: string
  matchId: string
  senderId: string
  sender: User
  content: string
  readAt: string | null
  createdAt: string
}

export interface Conversation {
  matchId: string
  petName: string
  petPhoto: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar: string
  lastMessage: string | null
  lastMessageAt: string
  unreadCount: number
  matchStatus: string
}

export interface Match {
  id: string
  petId: string
  interestedUserId: string
  pet: Pet
  interestedUser: User
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'adopted' | 'cancelled'
  message?: string
  phone?: string
  experience?: string
  motivation?: string
  hasHouse?: boolean
  hasOtherPets?: boolean
  createdAt: string
}

export type PostType = 'tip' | 'promotion' | 'event' | 'adoption_drive' | 'update'

export interface Post {
  id: string
  authorId: string
  author: User
  content: string
  media: string[]
  type: PostType
  petId?: string
  pet?: Pet
  organizationId?: string
  organization?: Organization
  sharedPostId?: string
  sharedPost?: Post
  commentCount?: number
  sharesCount?: number
  createdAt: string
}

export interface PostFeed {
  posts: Post[]
  total: number
}

export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'

export interface ReactionCounts {
  counts: Record<ReactionType, number>
  total: number
  userReaction: ReactionType | null
}

export interface Notification {
  id: string
  userId: string
  type: 'follow' | 'reaction' | 'comment' | 'match_request' | 'match_accepted' | 'match_rejected' | 'match_adopted' | 'report'
  message: string
  referenceId: string | null
  referenceType: string | null
  read: boolean
  createdAt: string
}

export interface Follow {
  id: string
  followerId: string
  targetUserId: string
  createdAt: string
}
