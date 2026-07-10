import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { getSocket, getUserId, emitTyping, emitStopTyping } from '../../services/socket'
import type { Message as MessageType, User } from '../../types'
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react'

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDateSeparator(date: Date) {
  const now = new Date()
  if (sameDay(date, now)) return 'Hoje'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (sameDay(date, yesterday)) return 'Ontem'
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<MessageType[]>([])
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [typingUser, setTypingUser] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>()
  const userId = getUserId()

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
    if (!matchId) return

    api.patch(`/messages/${matchId}/read`)

    const socket = getSocket()
    socket.emit('join_match', { matchId })

    const handleNewMessage = (message: MessageType) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
      if (!otherUser && message.sender) setOtherUser(message.sender)
      if (message.senderId !== userId) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        api.patch(`/messages/${matchId}/read`)
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

    return () => {
      socket.emit('leave_match', { matchId })
      socket.off('new_message', handleNewMessage)
      socket.off('user_online', handleOnline)
      socket.off('user_offline', handleOffline)
      socket.off('user_typing', handleTyping)
      socket.off('user_stop_typing', handleStopTyping)
    }
  }, [matchId, queryClient, userId, otherUser])

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

  // Find date separators
  const dateSeparators: Set<number> = new Set()
  messages.forEach((msg, i) => {
    if (i === 0) {
      dateSeparators.add(i)
      return
    }
    const prev = messages[i - 1]
    if (!sameDay(new Date(msg.createdAt), new Date(prev.createdAt))) {
      dateSeparators.add(i)
    }
  })

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-300 shrink-0">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/conversations')}
            className="p-1.5 hover:bg-gray-200 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600 overflow-hidden shrink-0">
            {otherUser?.avatar ? (
              <img
                src={otherUser.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              otherUser?.name?.charAt(0).toUpperCase() || '?'
            )}
          </div>
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

      {/* MESSAGES */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl w-full mx-auto">
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
          <div className="space-y-0.5">
            {messages.map((msg, idx) => {
              const isMine = msg.senderId === userId
              const prev = messages[idx - 1]
              const next = messages[idx + 1]
              const isFirst = !prev || prev.senderId !== msg.senderId
              const isLast = !next || next.senderId !== msg.senderId
              const showDate = dateSeparators.has(idx)

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-gray-200 text-gray-500 text-[11px] font-semibold px-3 py-1 rounded-full">
                        {formatDateSeparator(new Date(msg.createdAt))}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${
                      isMine ? 'justify-end' : 'justify-start'
                    } ${!isLast && !isFirst ? 'my-0' : ''}`}
                  >
                    <div className="flex items-end gap-1.5 max-w-[70%]">
                      {isLast && !isMine && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-medium text-indigo-600 overflow-hidden shrink-0 mb-0.5">
                          {msg.sender?.avatar ? (
                            <img
                              src={msg.sender.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            msg.sender?.name?.charAt(0).toUpperCase() || '?'
                          )}
                        </div>
                      )}
                      {!isLast && !isMine && <div className="w-7 shrink-0" />}
                      <div>
                        <div
                          className={`px-3 py-1.5 text-sm leading-relaxed break-words ${
                            isMine
                              ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                              : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border border-gray-200'
                          } ${!isLast ? 'rounded-bl-md rounded-br-md' : ''}`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {isLast && (
                          <div
                            className={`flex items-center gap-1 mt-0.5 ${
                              isMine ? 'justify-end mr-1' : 'ml-1'
                            }`}
                          >
                            <span className="text-[10px] text-gray-400">
                              {formatTime(new Date(msg.createdAt))}
                            </span>
                            {isMine &&
                              (msg.readAt ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-gray-400" />
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* TYPING INDICATOR */}
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

      {/* INPUT */}
      <div className="bg-white border-t border-gray-300 shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-gray-200 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
