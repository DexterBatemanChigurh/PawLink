import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Share2, Megaphone, Calendar, Home, Stethoscope, MoreHorizontal, Pencil, Trash2, Bookmark, Globe, Flag, X } from 'lucide-react'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useConfirmStore } from '../../store/confirm.store'
import { useToastStore } from '../../store/toast.store'
import type { Post, ReactionCounts, ReactionType } from '../../types'
import { ReactionsPopup, ReactionIcon } from './reactions-popup'
import { CommentsSection } from './comments-section'
import { ShareModal } from './share-modal'
import { Avatar } from '../ui/avatar'
import { ROLE_BADGE } from '../../types/constants'

interface PostCardProps {
  post: Post
}

const typeConfig: Record<string, { label: string; icon: typeof Heart; color: string }> = {
  tip: { label: 'Dica', icon: Stethoscope, color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30' },
  promotion: { label: 'Promoção', icon: Megaphone, color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30' },
  event: { label: 'Evento', icon: Calendar, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30' },
  adoption_drive: { label: 'Campanha', icon: Home, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' },
  update: { label: 'Atualização', icon: Heart, color: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/30' },
}

function formatTimeAgo(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('pt-BR')
}

export function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const confirm = useConfirmStore()
  const cfg = typeConfig[post.type] || typeConfig.update
  const [showReactions, setShowReactions] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const likeRef = useRef<HTMLButtonElement>(null)
  const isAuthor = user?.id === post.authorId
  const toast = useToastStore()

  const { data: reactions } = useQuery<ReactionCounts>({
    queryKey: ['reactions', post.id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${post.id}/reactions`)
      return data
    },
  })

  const reactMutation = useMutation({
    mutationFn: async (type: ReactionType) => {
      await api.post(`/posts/${post.id}/reactions`, { type })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', post.id] })
    },
  })

  const { data: isBookmarked } = useQuery<boolean>({
    queryKey: ['bookmark', post.id],
    queryFn: async () => {
      const { data } = await api.get(`/bookmarks/${post.id}`)
      return data
    },
  })

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${post.id}`)
      } else {
        await api.post(`/bookmarks/${post.id}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', post.id] })
    },
  })

  const editMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.patch(`/posts/${post.id}`, { content })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${post.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
    },
  })

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      await api.post(`/posts/${post.id}/report`, { reason, description: reason })
    },
    onSuccess: () => {
      toast.add('Denúncia enviada com sucesso', 'success')
      setShowReportModal(false)
      setReportReason('')
    },
    onError: () => {
      toast.add('Erro ao enviar denúncia', 'error')
    },
  })

  const userReaction = reactions?.userReaction
  const totalReactions = reactions?.total || 0
  const topReaction = reactions?.counts
    ? Object.entries(reactions.counts).sort((a, b) => b[1] - a[1])[0]
    : null

  return (
    <article className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - Facebook style */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(`/profile?id=${post.authorId}`)} aria-label={`Ver perfil de ${post.author.name}`} className="shrink-0">
          <Avatar src={post.author.avatar} name={post.author.name} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/profile?id=${post.authorId}`)}
              className="text-[15px] font-semibold text-gray-900 truncate hover:underline leading-tight"
            >
              {post.author.name}
            </button>
            {ROLE_BADGE[post.author.role] && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ROLE_BADGE[post.author.role].color} shrink-0`}>
                {ROLE_BADGE[post.author.role].label}
              </span>
            )}
            <span className={`ml-auto inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.color} shrink-0`}>
              <cfg.icon className="w-2.5 h-2.5" />
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[13px] text-gray-500">{formatTimeAgo(post.createdAt)}</span>
            <Globe className="w-3 h-3 text-gray-400" />
          </div>
        </div>
        {/* Three-dot menu - always visible for everyone */}
        <div className="relative shrink-0 self-start">
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Ações do post"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-card rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                {isAuthor ? (
                  <>
                    <button
                      onClick={() => { setEditContent(post.content); setEditing(true); setShowMenu(false) }}
                      className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Pencil className="w-4 h-4" /> Editar post
                    </button>
                    <button
                      onClick={() => { bookmarkMutation.mutate(); setShowMenu(false) }}
                      className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-gray-700' : ''}`} />
                      {isBookmarked ? 'Remover dos salvos' : 'Salvar post'}
                    </button>
                    <hr className="border-gray-200" />
                    <button
                      onClick={() => { setShowMenu(false); confirm.show({ title: 'Excluir post', message: 'Tem certeza que deseja excluir este post?', variant: 'danger', confirmLabel: 'Excluir', onConfirm: () => deleteMutation.mutate() }) }}
                      className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" /> Excluir post
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { bookmarkMutation.mutate(); setShowMenu(false) }}
                      className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-gray-700' : ''}`} />
                      {isBookmarked ? 'Remover dos salvos' : 'Salvar post'}
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); setShowReportModal(true) }}
                      className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Flag className="w-4 h-4" /> Denunciar post
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-1">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                Cancelar
              </button>
              <button
                onClick={() => editMutation.mutate(editContent)}
                disabled={!editContent.trim() || editMutation.isPending}
                className="text-xs text-primary hover:text-blue-700 dark:hover:text-blue-400 font-medium"
              >
                {editMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className={`grid ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5 pt-1`}>
          {post.media.map((url, idx) => (
            <div key={idx} className="bg-gray-100" style={{ aspectRatio: '16/9' }}>
              <img loading="lazy" decoding="async" src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Linked pet */}
      {post.pet && (
        <div className="mx-4 my-2">
          <button
            onClick={() => navigate(`/pets/${post.pet.id}`)}
            className="w-full flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xl shrink-0">
              {post.pet.photos?.[0] ? (
                <img loading="lazy" decoding="async" src={post.pet.photos[0]} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                '🐾'
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">{post.pet.name}</p>
              <p className="text-xs text-gray-500">{post.pet.breed || 'SRD'}</p>
            </div>
          </button>
        </div>
      )}

      {/* Shared post */}
      {post.sharedPost && (
        <div className="mx-4 mb-2 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-semibold overflow-hidden">
              {post.sharedPost.author.avatar ? (
                <img loading="lazy" decoding="async" src={post.sharedPost.author.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                post.sharedPost.author.name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-xs font-semibold text-gray-900 truncate">{post.sharedPost.author.name}</span>
            <span className="text-[10px] text-gray-400">
              {new Date(post.sharedPost.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="px-3 pb-2">
            <p className="text-xs text-gray-700 leading-relaxed">{post.sharedPost.content}</p>
          </div>
          {post.sharedPost.media && post.sharedPost.media.length > 0 && (
            <div className={`grid ${post.sharedPost.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-px`}>
              {post.sharedPost.media.map((url, idx) => (
                <div key={idx} className="bg-gray-200" style={{ aspectRatio: '16/9' }}>
                  <img loading="lazy" decoding="async" src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          {post.sharedPost.pet && (
            <div className="px-3 pb-2 pt-1">
              <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-base shrink-0">
                  {post.sharedPost.pet.photos?.[0] ? (
                    <img loading="lazy" decoding="async" src={post.sharedPost.pet.photos[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    '🐾'
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-900">{post.sharedPost.pet.name}</p>
                  <p className="text-[10px] text-gray-500">{post.sharedPost.pet.breed || 'SRD'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats bar - display only, shows counts when > 0 */}
      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          {topReaction && totalReactions > 0 && (
            <>
              <ReactionIcon type={topReaction[0]} size={16} />
              <span className="text-[15px]">{totalReactions}</span>
            </>
          )}
        </div>
        {(post.commentCount ?? 0) > 0 || (post.sharesCount ?? 0) > 0 ? (
          <div className="flex items-center gap-3 text-[15px]">
            {(post.commentCount ?? 0) > 0 && (
              <span>{post.commentCount} comentário{(post.commentCount ?? 0) !== 1 ? 's' : ''}</span>
            )}
            {(post.sharesCount ?? 0) > 0 && (
              <span>{post.sharesCount} compartilhamento{(post.sharesCount ?? 0) !== 1 ? 's' : ''}</span>
            )}
          </div>
        ) : null}
      </div>

      {/* Action bar - Facebook style: Like | Comment | Share */}
      <div className="flex items-center border-t border-b border-gray-100 mx-4 py-0.5">
        <div
          className="relative flex-1"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            ref={likeRef}
            onClick={() => {
              if (userReaction) {
                reactMutation.mutate(userReaction)
              } else {
                reactMutation.mutate('like')
              }
            }}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded text-sm font-semibold transition-colors ${
              userReaction
                ? 'text-primary'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {userReaction ? <ReactionIcon type={userReaction} size={20} /> : <Heart className="w-5 h-5" />}
            <span>{userReaction ? reactionLabel(userReaction) : 'Curtir'}</span>
          </button>
          {showReactions && (
            <ReactionsPopup
              onReact={(type) => reactMutation.mutate(type)}
              onClose={() => setShowReactions(false)}
            />
          )}
        </div>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-sm font-semibold transition-colors ${
            showComments
              ? 'text-primary'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span>Comentar</span>
        </button>
        <button
          onClick={() => setShowShare(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-gray-500 hover:bg-gray-100 rounded text-sm font-semibold transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>Compartilhar</span>
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} />}

      {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowReportModal(false); setReportReason('') }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Escape') { setShowReportModal(false); setReportReason('') } }} aria-label="Fechar">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Denunciar post</h3>
              <button onClick={() => { setShowReportModal(false); setReportReason('') }} className="p-1 rounded hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Descreva o motivo da denúncia..."
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg p-3 pb-8 text-sm outline-none resize-none focus:border-[#1877F2]"
              rows={4}
            />
            <div className="text-xs text-gray-400 text-right -mt-6 pr-3 pointer-events-none">
              {reportReason.length}/500
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowReportModal(false); setReportReason('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => reportMutation.mutate(reportReason)}
                disabled={!reportReason.trim() || reportMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {reportMutation.isPending ? 'Enviando...' : 'Denunciar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

function reactionLabel(type: string): string {
  const labels: Record<string, string> = {
    like: 'Curtir',
    love: 'Amei',
    laugh: 'Haha',
    wow: 'Uau',
    sad: 'Triste',
    angry: 'Grr',
  }
  return labels[type] || 'Curtir'
}
