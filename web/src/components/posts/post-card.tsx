import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Share2, Pill, Megaphone, Calendar, Home, Stethoscope } from 'lucide-react'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import type { Post, ReactionCounts, ReactionType } from '../../types'
import { ReactionsPopup, ReactionIcon } from './reactions-popup'
import { CommentsSection } from './comments-section'

interface PostCardProps {
  post: Post
}

const typeConfig: Record<string, { label: string; icon: typeof Heart; color: string }> = {
  tip: { label: 'Dica', icon: Stethoscope, color: 'text-green-600 bg-green-50' },
  promotion: { label: 'Promoção', icon: Megaphone, color: 'text-orange-600 bg-orange-50' },
  event: { label: 'Evento', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  adoption_drive: { label: 'Campanha', icon: Home, color: 'text-blue-600 bg-blue-50' },
  update: { label: 'Atualização', icon: Heart, color: 'text-pink-600 bg-pink-50' },
}

const roleBadges: Record<string, { label: string; color: string }> = {
  veterinary: { label: 'Veterinário', color: 'bg-green-100 text-green-700' },
  petshop: { label: 'Petshop', color: 'bg-blue-100 text-blue-700' },
  ong: { label: 'ONG', color: 'bg-purple-100 text-purple-700' },
  independent_rescuer: { label: 'Resgatista', color: 'bg-amber-100 text-amber-700' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
}

export function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const cfg = typeConfig[post.type] || typeConfig.update
  const [showReactions, setShowReactions] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const likeRef = useRef<HTMLButtonElement>(null)

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

  const userReaction = reactions?.userReaction
  const totalReactions = reactions?.total || 0
  const topReaction = reactions?.counts
    ? Object.entries(reactions.counts).sort((a, b) => b[1] - a[1])[0]
    : null

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(`/profile?id=${post.authorId}`)} className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center overflow-hidden">
            {post.author.avatar ? (
              <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-semibold">
                {post.author.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/profile?id=${post.authorId}`)}
              className="text-sm font-semibold text-gray-900 truncate hover:underline"
            >
              {post.author.name}
            </button>
            {roleBadges[post.author.role] && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${roleBadges[post.author.role].color} shrink-0`}>
                {roleBadges[post.author.role].label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded ${cfg.color}`}>
              <cfg.icon className="w-3 h-3" />
              {cfg.label}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(post.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className={`grid ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5 px-0.5`}>
          {post.media.map((url, idx) => (
            <div key={idx} className="bg-gray-100" style={{ aspectRatio: '16/9' }}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Linked pet */}
      {post.pet && (
        <div className="mx-4 mb-2">
          <button
            onClick={() => navigate(`/pets/${post.pet.id}`)}
            className="w-full flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xl shrink-0">
              {post.pet.photos?.[0] ? (
                <img src={post.pet.photos[0]} alt="" className="w-full h-full object-cover rounded-lg" />
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

      {/* Reaction counts */}
      {reactions && totalReactions > 0 && (
        <div className="px-4 pb-1 flex items-center gap-1.5 text-xs text-gray-500">
          {topReaction && topReaction[1] > 0 && (
            <ReactionIcon type={topReaction[0]} size={14} />
          )}
          <span>{totalReactionLabel(reactions)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3 pt-1 flex items-center gap-1 border-t border-gray-100 mt-1">
        <div className="relative flex-1">
          <button
            ref={likeRef}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            onClick={() => {
              if (userReaction) {
                reactMutation.mutate(userReaction)
              } else {
                reactMutation.mutate('like')
              }
            }}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors ${
              userReaction
                ? 'text-[#1877F2] bg-blue-50 hover:bg-blue-100'
                : 'text-gray-500 hover:text-[#1877F2] hover:bg-gray-100'
            }`}
          >
            {userReaction ? <ReactionIcon type={userReaction} size={16} /> : <Heart className="w-4 h-4" />}
            {userReaction ? reactionLabel(userReaction) : 'Curtir'}
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
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors ${
            showComments
              ? 'text-[#1877F2] bg-blue-50 hover:bg-blue-100'
              : 'text-gray-500 hover:text-[#1877F2] hover:bg-gray-100'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Comentar
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded text-xs font-medium transition-colors">
          <Share2 className="w-4 h-4" />
          Compartilhar
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} />}
    </article>
  )
}

function totalReactionLabel(r: ReactionCounts): string {
  const names: string[] = []
  if (r.counts.like > 0) names.push(`${r.counts.like}`)
  if (r.counts.love > 0) names.push(`❤️ ${r.counts.love}`)
  if (r.counts.laugh > 0) names.push(`😂 ${r.counts.laugh}`)
  if (r.counts.wow > 0) names.push(`😮 ${r.counts.wow}`)
  if (r.counts.sad > 0) names.push(`😢 ${r.counts.sad}`)
  if (r.counts.angry > 0) names.push(`😠 ${r.counts.angry}`)
  return names.join(' ')
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
