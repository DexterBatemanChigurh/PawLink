import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, UserPlus, Heart, MessageCircle, CheckCheck } from 'lucide-react'
import api from '../../services/api'
import type { Notification } from '../../types'

const typeIcons: Record<string, typeof Heart> = {
  follow: UserPlus,
  reaction: Heart,
  comment: MessageCircle,
  match_request: MessageCircle,
  match_accepted: CheckCheck,
  match_adopted: Heart,
}

const typeColors: Record<string, string> = {
  follow: 'text-blue-500 bg-blue-100',
  reaction: 'text-pink-500 bg-pink-100',
  comment: 'text-green-500 bg-green-100',
  match_request: 'text-purple-500 bg-purple-100',
  match_accepted: 'text-emerald-500 bg-emerald-100',
  match_adopted: 'text-rose-500 bg-rose-100',
}

export function NotificationsDropdown() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications')
      return data
    },
    refetchInterval: 30000,
  })

  const { data: unreadCount } = useQuery<number>({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count')
      return data
    },
    refetchInterval: 15000,
  })

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unread = unreadCount ?? 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        title="Notificações"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
            {unread > 0 && (
              <button
                onClick={() => readAllMutation.mutate()}
                className="text-xs font-semibold text-[#1877F2] hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {(!notifications || notifications.length === 0) ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Nenhuma notificação
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell
                const colorClass = typeColors[n.type] || 'text-gray-500 bg-gray-100'
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.read) readMutation.mutate(n.id)
                      if (n.referenceType === 'post') navigate(`/`)
                      else if (n.referenceType === 'match') navigate('/conversations')
                      else if (n.referenceType === 'user') navigate(`/profile?id=${n.referenceId}`)
                      setOpen(false)
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-[#1877F2] shrink-0 mt-1.5" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `Há ${mins} min`
  if (hours < 24) return `Há ${hours}h`
  if (days < 7) return `Há ${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}
