import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { getSocket, emitTyping, emitStopTyping } from '../../services/socket'
import { useAuthStore } from '../../store/auth.store'
import { useToastStore } from '../../store/toast.store'
import type { Conversation, Message as MessageType, User } from '../../types'
import { Skeleton } from '../../components/ui/skeleton'
import { Avatar } from '../../components/ui/avatar'
import { MessageSquare, Send, Check, CheckCheck, Search, ArrowLeft } from 'lucide-react'

function formatConvTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Ontem'
  if (days < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR')
}

function formatDateSeparator(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function MessagesPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const currentUser = useAuthStore((s) => s.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations')
      return data
    },
    refetchInterval: 10000,
  })

  const filteredConversations = conversations?.filter(conv =>
    conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    <div className="h-[calc(100vh-64px)] flex mx-auto max-w-[1280px] border border-gray-200 rounded-lg overflow-hidden bg-card shadow-sm">
      {/* Sidebar */}
      <div className="w-[360px] shrink-0 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-3">{currentUser?.name || 'Mensagens'}</h1>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar conversas..."
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm outline-none focus:bg-gray-200 transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : !filteredConversations?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
              <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">Nenhuma conversa</p>
              <p className="text-xs mt-1">As conversas aparecem após o match ser aceito</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conv) => {
                const isOnline = onlineUsers.has(conv.otherUserId)
                const isActive = conv.matchId === matchId
                return (
                  <button
                    key={conv.matchId}
                    onClick={() => navigate(`/messages/${conv.matchId}`)}
                    className={`w-full p-4 transition-colors text-left flex items-center gap-3 ${
                      isActive ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar src={conv.otherUserAvatar} name={conv.otherUserName} size="md" className="w-12 h-12 rounded-full" />
                      {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {conv.otherUserName}
                          </h3>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {formatConvTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        <span className="text-gray-400">{conv.petName}</span>
                        {conv.lastMessage ? ` — ${conv.lastMessage}` : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        {matchId ? (
          <ChatPanel matchId={matchId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Suas mensagens</p>
              <p className="text-sm mt-1">Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ChatPanelProps {
  matchId: string
}

function ChatPanel({ matchId }: ChatPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const toast = useToastStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<MessageType[]>([])
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [typingUser, setTypingUser] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>()
  const otherUserRef = useRef(otherUser)
  otherUserRef.current = otherUser

  const { data: initialMessages, isLoading } = useQuery<MessageType[]>({
    queryKey: ['messages', matchId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${matchId}`)
      return data
    },
    enabled: !!matchId,
  })

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
      const other = initialMessages.find((m) => m.senderId !== userId)?.sender
      if (other) setOtherUser(other)
    }
  }, [initialMessages, userId])

  useEffect(() => {
    if (!matchId || !userId) return
    api.patch(`/messages/${matchId}/read`).catch(() => {})
    const socket = getSocket()
    socket.emit('join_match', { matchId })

    const handleError = (err: { message: string }) => {
      toast.add(err.message || 'Erro ao enviar mensagem', 'error')
    }

    const handleNewMessage = (message: MessageType) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
      if (!otherUserRef.current && message.sender) setOtherUser(message.sender)
      if (message.senderId !== userId) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        api.patch(`/messages/${matchId}/read`).catch(() => {})
      }
    }

    const handleOnline = (payload: { userId: string }) => {
      if (payload.userId !== userId) setIsOnline(true)
    }
    const handleOffline = (payload: { userId: string }) => {
      if (payload.userId !== userId) setIsOnline(false)
    }
    const handleTyping = (payload: { userId: string }) => {
      if (payload.userId !== userId) setTypingUser(true)
    }
    const handleStopTyping = (payload: { userId: string }) => {
      if (payload.userId !== userId) setTypingUser(false)
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_online', handleOnline)
    socket.on('user_offline', handleOffline)
    socket.on('user_typing', handleTyping)
    socket.on('user_stop_typing', handleStopTyping)
    socket.on('error', handleError)

    return () => {
      socket.emit('leave_match', { matchId })
      socket.off('new_message', handleNewMessage)
      socket.off('user_online', handleOnline)
      socket.off('user_offline', handleOffline)
      socket.off('user_typing', handleTyping)
      socket.off('user_stop_typing', handleStopTyping)
      socket.off('error', handleError)
    }
  }, [matchId, queryClient, userId])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUser, scrollToBottom])

  const handleSend = () => {
    const text = input.trim()
    if (!text || !matchId) return
    emitStopTyping(matchId)
    getSocket().emit('send_message', { matchId, content: text })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (!matchId) return
    emitTyping(matchId)
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => emitStopTyping(matchId), 2000)
  }

  if (!userId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 h-16">
          <button
            onClick={() => navigate('/messages')}
            aria-label="Voltar para conversas"
            className="p-1.5 hover:bg-gray-100 rounded-full lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <Avatar src={otherUser?.avatar} name={otherUser?.name || ''} size="sm" className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">
              {otherUser?.name || 'Carregando...'}
            </h1>
            <p className="text-xs text-gray-500">
              {typingUser ? (
                <span className="text-green-600">Digitando...</span>
              ) : isOnline ? (
                <span className="text-green-600">Online agora</span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs mt-1">
              Envie a primeira para {otherUser?.name || 'o usuário'}
            </p>
          </div>
        ) : (
          <div>
            {messages.map((msg, idx) => {
              const senderId = msg.sender?.id || msg.senderId
              const isMine = senderId === userId
              const showDateSep = idx === 0 || !sameDay(new Date(messages[idx - 1].createdAt), new Date(msg.createdAt))

              return (
                <div key={msg.id} className="mb-2">
                  {showDateSep && (
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-gray-200 text-gray-500 text-[11px] font-semibold px-3 py-1 rounded-full">
                        {formatDateSeparator(new Date(msg.createdAt))}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`${isMine ? 'ml-12' : 'mr-12'} max-w-[70%]`}>
                      {!isMine && (
                        <p className="text-[11px] font-semibold text-gray-500 mb-0.5 ml-1">
                          {msg.sender?.name || otherUser?.name || 'Usuário'}
                        </p>
                      )}
                      {isMine && (
                        <p className="text-[11px] font-semibold text-gray-400 mb-0.5 mr-1 text-right">
                          Você
                        </p>
                      )}
                      <div
                        className={`px-3 py-2 text-sm leading-relaxed break-words ${
                          isMine
                            ? 'bg-primary text-white rounded-2xl rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div
                        className={`flex items-center gap-1 mt-0.5 ${
                          isMine ? 'justify-end mr-1' : 'justify-start ml-1'
                        }`}
                      >
                        <span className="text-[10px] text-gray-400">
                          {formatTime(new Date(msg.createdAt))}
                        </span>
                        {isMine &&
                          (msg.readAt ? (
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {typingUser && (
          <div className="flex items-center gap-1 ml-1 mt-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-200">
        <div className="px-4 py-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            aria-label="Digite sua mensagem"
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-gray-200 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Enviar mensagem"
            className="p-2.5 bg-primary text-white rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}
