import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, X, ChevronDown } from 'lucide-react'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import type { Conversation } from '../../types'

export function MessengerPopup() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations-popup'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations')
      return data
    },
    refetchInterval: 15000,
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const totalUnread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-50">
      {/* Popup */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-[#1877F2] text-white px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Conversas</h3>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded p-0.5">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-gray-400">Carregando...</div>
            ) : !conversations?.length ? (
              <div className="text-center py-8 text-sm text-gray-400">
                Nenhuma conversa ativa
              </div>
            ) : (
              conversations.map((conv) => {
                const isOnline = onlineUsers.has(conv.otherUserId)
                return (
                  <button
                    key={conv.matchId}
                    onClick={() => {
                      navigate(`/messages/${conv.matchId}`)
                      setOpen(false)
                    }}
                    className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-center gap-3"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-xs font-medium text-white overflow-hidden">
                        {conv.otherUserAvatar ? (
                          <img src={conv.otherUserAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          conv.otherUserName.charAt(0).toUpperCase()
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {conv.otherUserName}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0 ml-1">
                          {formatShortTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.lastMessage || 'Início da conversa'}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <button
            onClick={() => { navigate('/conversations'); setOpen(false) }}
            className="w-full px-4 py-2.5 text-sm font-semibold text-[#1877F2] border-t border-gray-100 hover:bg-gray-50 transition-colors"
          >
            Ver todas no Messenger
          </button>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-12 h-12 rounded-full bg-[#1877F2] text-white shadow-lg hover:bg-[#166fe5] transition-colors flex items-center justify-center"
        title="Messenger"
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  )
}

function formatShortTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Ontem'
  if (days < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR')
}
