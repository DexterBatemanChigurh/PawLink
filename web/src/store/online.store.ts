import { create } from 'zustand'

interface OnlineStore {
  onlineUsers: string[]
  setOnline: (userId: string) => void
  setOffline: (userId: string) => void
}

export const useOnlineStore = create<OnlineStore>((set) => ({
  onlineUsers: [],
  setOnline: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.includes(userId)
        ? state.onlineUsers
        : [...state.onlineUsers, userId],
    })),
  setOffline: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    })),
}))
