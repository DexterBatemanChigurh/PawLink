import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Copy, Check, Send, ExternalLink, Share2, MessageCircle } from 'lucide-react'
import { getSocket } from '../../services/socket'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useToastStore } from '../../store/toast.store'
import { Avatar } from '../ui/avatar'
import type { Post, Conversation } from '../../types'

interface ShareModalProps {
  post: Post
  onClose: () => void
  onShared?: () => void
}

export function ShareModal({ post, onClose, onShared }: ShareModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const toast = useToastStore()
  const [quote, setQuote] = useState('')
  const [copied, setCopied] = useState(false)
  const [sendMode, setSendMode] = useState<'feed' | 'message'>('feed')
  const [selectedMatchId, setSelectedMatchId] = useState('')

  const originalPostId = post.sharedPost?.id || post.id

  const shareMutation = useMutation({
    mutationFn: async (withText: boolean) => {
      await api.post(`/posts/${originalPostId}/share`, {
        content: withText ? (quote.trim() || undefined) : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.add('Compartilhado no feed!', 'success')
      onShared?.()
      onClose()
    },
  })

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['conversations-share'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations')
      return data
    },
  })

  const handleShareMessage = () => {
    if (!selectedMatchId) return
    const socket = getSocket()
    const msg = quote.trim() || `Viu este post?`
    socket.emit('send_message', {
      matchId: selectedMatchId,
      content: msg,
      postId: originalPostId,
    })
    toast.add('Compartilhado na mensagem!', 'success')
    onClose()
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/?post=${originalPostId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); onClose() }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }} aria-label="Fechar">
      <div
        className="bg-card rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Compartilhar</h3>
          <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Avatar src={post.author.avatar} name={post.author.name} size="sm" />
              <span className="text-xs font-semibold text-gray-900 truncate">{post.author.name}</span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">{post.content}</p>
          </div>

          {/* Share mode toggle */}
          <div className="flex gap-1 mb-3 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setSendMode('feed')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                sendMode === 'feed' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              No Feed
            </button>
            <button
              onClick={() => setSendMode('message')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                sendMode === 'message' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Na Mensagem
            </button>
          </div>

          {sendMode === 'feed' ? (
            <div className="space-y-3">
              <button
                onClick={() => shareMutation.mutate(false)}
                disabled={shareMutation.isPending}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {shareMutation.isPending ? 'Compartilhando...' : 'Compartilhar agora (sem texto)'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-card text-gray-400">ou</span>
                </div>
              </div>

              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Diga algo sobre isso..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none resize-none focus:border-primary"
                rows={2}
              />
              <button
                onClick={() => shareMutation.mutate(true)}
                disabled={!quote.trim() || shareMutation.isPending}
                className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {shareMutation.isPending ? 'Compartilhando...' : 'Compartilhar com texto'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations && conversations.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.matchId}
                      onClick={() => setSelectedMatchId(conv.matchId)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                        selectedMatchId === conv.matchId
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <Avatar src={conv.otherUserAvatar} name={conv.otherUserName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{conv.otherUserName}</p>
                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-3">
                  Nenhuma conversa ativa
                </p>
              )}

              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Escreva uma mensagem (opcional)..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none resize-none focus:border-primary"
                rows={2}
              />

              <button
                onClick={handleShareMessage}
                disabled={!selectedMatchId}
                className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar mensagem
              </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Compartilhar em:</p>
              <button
                onClick={handleCopyLink}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>
            </div>
            <div className="flex gap-2">
              {[
                {
                  name: 'WhatsApp',
                  color: 'hover:bg-green-500 hover:text-white text-green-600',
                  getUrl: () => {
                    const msg = `${post.content?.substring(0, 100)}... — PawLink`
                    return `https://wa.me/?text=${encodeURIComponent(msg)}`
                  },
                },
                {
                  name: 'Facebook',
                  color: 'hover:bg-blue-600 hover:text-white text-blue-600',
                  getUrl: () => {
                    const url = `${window.location.origin}/?post=${originalPostId}`
                    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                  },
                },
                {
                  name: 'X',
                  color: 'hover:bg-black hover:text-white text-gray-700',
                  getUrl: () => {
                    const msg = `${post.content?.substring(0, 100)}... — PawLink`
                    const url = `${window.location.origin}/?post=${originalPostId}`
                    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(url)}`
                  },
                },
                {
                  name: 'Telegram',
                  color: 'hover:bg-sky-500 hover:text-white text-sky-500',
                  getUrl: () => {
                    const msg = `${post.content?.substring(0, 100)}... — PawLink`
                    const url = `${window.location.origin}/?post=${originalPostId}`
                    return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}`
                  },
                },
              ].map((net) => (
                <button
                  key={net.name}
                  onClick={() => {
                    window.open(net.getUrl(), '_blank', 'noopener')
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg border border-gray-200 text-xs font-semibold transition-colors ${net.color}`}
                >
                  {net.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
