import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import type { Message as MessageType } from '../../types'
import { ArrowLeft, Send, Trash2 } from 'lucide-react'

export function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<MessageType[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const userId = JSON.parse(atob(localStorage.getItem('accessToken')!.split('.')[1])).sub

  const { data: initialMessages, isLoading } = useQuery<MessageType[]>({
    queryKey: ['messages', matchId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${matchId}`)
      return data
    },
    enabled: !!matchId,
  })

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

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
      if (message.senderId !== userId) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
      }
    }

    socket.on('new_message', handleNewMessage)

    return () => {
      socket.emit('leave_match', { matchId })
      socket.off('new_message', handleNewMessage)
    }
  }, [matchId, queryClient, userId])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = () => {
    const text = input.trim()
    if (!text || !matchId) return

    const socket = getSocket()
    socket.emit('send_message', { matchId, content: text })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/conversations')} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Conversa</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {isLoading ? (
            <div className="text-center py-20 text-gray-400">Carregando...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              Nenhuma mensagem ainda. Envie a primeira!
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === userId
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    {!isMine && (
                      <p className="text-xs font-medium text-gray-500 mb-0.5">
                        {msg.sender.name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMine ? 'text-indigo-200' : 'text-gray-400'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  )
}
