import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import type { Conversation } from '../../types'
import { Skeleton } from '../../components/ui/skeleton'
import { EmptyState } from '../../components/ui/empty-state'
import { Avatar } from '../../components/ui/avatar'
import { MessageSquare } from 'lucide-react'

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  if (days === 1) return 'Ontem'
  if (days < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR')
}

export function ConversationsPage() {
  const navigate = useNavigate()
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations')
      return data
    },
    refetchInterval: 10000,
  })

  useEffect(() => {
    const socket = getSocket()

    const handleOnline = (payload: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(payload.userId))
    }
    const handleOffline = (payload: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(payload.userId)
        return next
      })
    }

    socket.on('user_online', handleOnline)
    socket.on('user_offline', handleOffline)

    return () => {
      socket.off('user_online', handleOnline)
      socket.off('user_offline', handleOffline)
    }
  }, [])

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Mensagens</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : !conversations?.length ? (
        <EmptyState icon={MessageSquare} title="Nenhuma conversa" description="As conversas aparecem após o match ser aceito" />
      ) : (
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          {conversations.map((conv) => {
            const isOnline = onlineUsers.has(conv.otherUserId)
            return (
              <button
                key={conv.matchId}
                onClick={() => navigate(`/messages/${conv.matchId}`)}
                className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-center gap-3"
              >
                <div className="relative shrink-0">
                  <Avatar src={conv.otherUserAvatar} name={conv.otherUserName} size="lg" />
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.otherUserName}
                      </h3>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-500 dark:bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    <span className="text-gray-400">{conv.petName}</span> — {conv.lastMessage || 'Início da conversa'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
