import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Copy, Check, Send, ExternalLink } from 'lucide-react'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import type { Post } from '../../types'

interface ShareModalProps {
  post: Post
  onClose: () => void
  onShared?: () => void
}

export function ShareModal({ post, onClose, onShared }: ShareModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'share' | 'copy' | 'send'>('share')
  const [quote, setQuote] = useState('')
  const [copied, setCopied] = useState(false)

  const shareMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/posts/${post.id}/share`, { content: quote.trim() || undefined })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      onShared?.()
      onClose()
    },
  })

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/?post=${post.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); onClose() }, 1500)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }} aria-label="Fechar">
        <div
          className="bg-card rounded-lg shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Compartilhar</h3>
            <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { key: 'share', label: 'Compartilhar agora', icon: Send },
              { key: 'copy', label: 'Copiar link', icon: Copy },
              { key: 'send', label: 'Enviar via chat', icon: ExternalLink },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                  tab === t.key
                    ? 'text-primary border-b-2 border-[#1877F2]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {/* Preview of the post being shared */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-semibold overflow-hidden">
                  {post.author.avatar ? (
                    <img loading="lazy" decoding="async" src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    post.author.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-900 truncate">{post.author.name}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{post.content}</p>
            </div>

            {tab === 'share' && (
              <div>
                <textarea
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Diga algo sobre isso..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none resize-none focus:border-[#1877F2]"
                  rows={3}
                />
                <button
                  onClick={() => shareMutation.mutate()}
                  disabled={shareMutation.isPending}
                  className="w-full mt-3 bg-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {shareMutation.isPending ? 'Compartilhando...' : 'Compartilhar agora'}
                </button>
              </div>
            )}

            {tab === 'copy' && (
              <div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <code className="flex-1 text-xs text-gray-600 truncate">
                    {window.location.origin}/?post={post.id}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    aria-label="Copiar link"
                    className="shrink-0 text-primary hover:text-blue-700 dark:hover:text-blue-400"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && <p className="text-xs text-green-600 mt-2">Link copiado!</p>}
              </div>
            )}

            {tab === 'send' && (
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  Envie este post para alguém pelo Messenger.
                </p>
                <button
                  onClick={() => { navigate('/conversations'); onClose() }}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Ir para o Messenger
                </button>
              </div>
            )}

            {/* External Networks */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Compartilhar em:</p>
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
                      const url = `${window.location.origin}/?post=${post.id}`
                      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                    },
                  },
                  {
                    name: 'X',
                    color: 'hover:bg-black hover:text-white text-gray-700',
                    getUrl: () => {
                      const msg = `${post.content?.substring(0, 100)}... — PawLink`
                      const url = `${window.location.origin}/?post=${post.id}`
                      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(url)}`
                    },
                  },
                  {
                    name: 'Telegram',
                    color: 'hover:bg-sky-500 hover:text-white text-sky-500',
                    getUrl: () => {
                      const msg = `${post.content?.substring(0, 100)}... — PawLink`
                      const url = `${window.location.origin}/?post=${post.id}`
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
    </>
  )
}
