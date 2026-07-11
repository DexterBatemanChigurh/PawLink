import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { Avatar } from '../ui/avatar'

interface Comment {
  id: string
  userId: string
  user: { id: string; name: string; avatar: string | null; role: string }
  postId: string
  content: string
  parentId: string | null
  replies?: Comment[]
  createdAt: string
}

interface CommentsSectionProps {
  postId: string
}

function formatTimeAgo(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `${Math.floor(diff / 86400)} d`
  return d.toLocaleDateString('pt-BR')
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editCommentId, setEditCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')

  const { data: comments } = useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${postId}/comments`)
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      await api.post(`/posts/${postId}/comments`, { content, parentId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setNewComment('')
      setReplyContent('')
      setReplyTo(null)
    },
  })

  const editMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      await api.patch(`/comments/${id}`, { content })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setEditCommentId(null)
      setEditCommentContent('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  return (
    <div className="border-t border-gray-100 px-4 py-3 space-y-3">
      {/* Input */}
      <div className="flex items-center gap-2">
        <Avatar src={user?.avatar} name={user?.name || ''} size="sm" />
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-1.5">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
            aria-label="Escreva um comentário"
            className="flex-1 bg-transparent text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newComment.trim()) {
                createMutation.mutate({ content: newComment.trim() })
              }
            }}
          />
          {newComment.trim() && (
            <button
              onClick={() => createMutation.mutate({ content: newComment.trim() })}
              disabled={createMutation.isPending}
              aria-label="Enviar comentário"
              className="text-primary hover:text-blue-700 dark:hover:text-blue-400"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comments list */}
      {comments?.map((comment) => (
        <div key={comment.id}>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/profile?id=${comment.userId}`)}
              aria-label={`Ver perfil de ${comment.user.name}`}
              className="shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                {comment.user.avatar ? (
                  <img loading="lazy" decoding="async" src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-600">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </button>
            <div className="flex-1 min-w-0">
              {editCommentId === comment.id ? (
                <div className="bg-gray-100 rounded-2xl px-3 py-2 space-y-2">
                  <textarea
                    value={editCommentContent}
                    onChange={(e) => setEditCommentContent(e.target.value)}
                    className="w-full bg-card border border-gray-200 rounded-lg p-2 text-sm outline-none resize-none focus:border-[#1877F2]"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditCommentId(null)} className="text-xs text-gray-500 font-medium">Cancelar</button>
                    <button
                      onClick={() => editMutation.mutate({ id: comment.id, content: editCommentContent })}
                      disabled={!editCommentContent.trim()}
                      className="text-xs text-primary font-medium"
                    >Salvar</button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-2xl px-3 py-2">
                  <button
                    onClick={() => navigate(`/profile?id=${comment.userId}`)}
                    className="text-xs font-semibold text-gray-900 hover:underline"
                  >
                    {comment.user.name}
                  </button>
                  <p className="text-sm text-gray-800">{comment.content}</p>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-0.5 ml-2">
                <span className="text-[12px] text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
                <span className="text-gray-300">·</span>
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="text-[12px] font-semibold text-gray-500 hover:text-gray-700"
                >
                  Responder
                </button>
                {comment.userId === user?.id && (
                  <>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={() => { setEditCommentId(comment.id); setEditCommentContent(comment.content) }}
                      className="text-[12px] font-semibold text-gray-500 hover:text-blue-500"
                    >
                      Editar
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={() => deleteMutation.mutate(comment.id)}
                      className="text-[12px] font-semibold text-gray-500 hover:text-red-500"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>

              {/* Reply input */}
              {replyTo === comment.id && (
                <div className="flex items-center gap-2 mt-2 ml-2">
                  <Avatar src={user?.avatar} name={user?.name || ''} size="sm" />
                  <div className="flex-1 flex items-center bg-gray-100 rounded-full px-2.5 py-1">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Escreva uma resposta..."
                      aria-label="Escreva uma resposta"
                      className="flex-1 bg-transparent text-xs outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && replyContent.trim()) {
                          createMutation.mutate({ content: replyContent.trim(), parentId: comment.id })
                        }
                      }}
                    />
                    {replyContent.trim() && (
                      <button
                        onClick={() => createMutation.mutate({ content: replyContent.trim(), parentId: comment.id })}
                        disabled={createMutation.isPending}
                        aria-label="Enviar resposta"
                        className="text-primary hover:text-blue-700 dark:hover:text-blue-400"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-1 space-y-2 ml-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2">
                      <button
                        onClick={() => navigate(`/profile?id=${reply.userId}`)}
                        aria-label={`Ver perfil de ${reply.user.name}`}
                        className="shrink-0"
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden">
                          {reply.user.avatar ? (
                            <img loading="lazy" decoding="async" src={reply.user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-gray-600">
                              {reply.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        {editCommentId === reply.id ? (
                          <div className="bg-gray-100 rounded-2xl px-3 py-1.5 space-y-1.5">
                            <textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              className="w-full bg-card border border-gray-200 rounded-lg p-1.5 text-xs outline-none resize-none focus:border-[#1877F2]"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setEditCommentId(null)} className="text-[10px] text-gray-500 font-medium">Cancelar</button>
                              <button
                                onClick={() => editMutation.mutate({ id: reply.id, content: editCommentContent })}
                                disabled={!editCommentContent.trim()}
                                className="text-[10px] text-primary font-medium"
                              >Salvar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-100 rounded-2xl px-3 py-1.5">
                            <button
                              onClick={() => navigate(`/profile?id=${reply.userId}`)}
                              className="text-xs font-semibold text-gray-900 hover:underline"
                            >
                              {reply.user.name}
                            </button>
                            <p className="text-xs text-gray-800">{reply.content}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 ml-1 mt-0.5">
                          <span className="text-[11px] text-gray-400">{formatTimeAgo(reply.createdAt)}</span>
                          {reply.userId === user?.id && (
                            <>
                              <span className="text-gray-300">·</span>
                              <button
                                onClick={() => { setEditCommentId(reply.id); setEditCommentContent(reply.content) }}
                                aria-label="Editar resposta"
                                className="text-[11px] text-gray-500 hover:text-blue-500 font-semibold"
                              >
                                Editar
                              </button>
                              <span className="text-gray-300">·</span>
                              <button
                                onClick={() => deleteMutation.mutate(reply.id)}
                                aria-label="Excluir resposta"
                                className="text-[11px] text-gray-500 hover:text-red-500 font-semibold"
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
