export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'moderator' | 'user'
  status: 'active' | 'inactive' | 'blocked'
  avatar?: string
  createdAt: string
}

export interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  age?: number
  size?: 'small' | 'medium' | 'large'
  status: 'available' | 'adopted' | 'in_treatment'
  photos: string[]
  ownerId: string
  city?: string
  state?: string
  createdAt: string
}

export interface Match {
  id: string
  userId: string
  petId: string
  score: number
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface DashboardStats {
  totalUsers: number
  totalPets: number
  totalMatches: number
  adoptionsCompleted: number
  usersGrowth: number
  petsGrowth: number
  matchesGrowth: number
}
