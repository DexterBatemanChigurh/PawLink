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

export interface Match {
  id: string
  petId: string
  interestedUserId: string
  pet: Pet
  interestedUser: User
  status: 'pending' | 'accepted' | 'rejected' | 'adopted'
  message?: string
  phone?: string
  createdAt: string
}
