import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Send, Trash2 } from 'lucide-react'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'

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

export function CommentsSection({ postId }: CommentsSectionProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

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
        <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center overflow-hidden shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xs font-semibold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-1.5">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
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
              className="text-[#1877F2] hover:text-blue-700"
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
              className="shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                {comment.user.avatar ? (
                  <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-600">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-100 rounded-2xl px-3 py-2">
                <button
                  onClick={() => navigate(`/profile?id=${comment.userId}`)}
                  className="text-xs font-semibold text-gray-900 hover:underline"
                >
                  {comment.user.name}
                </button>
                <p className="text-sm text-gray-800">{comment.content}</p>
              </div>
              <div className="flex items-center gap-3 mt-0.5 ml-2">
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  Responder
                </button>
                {comment.userId === user?.id && (
                  <button
                    onClick={() => deleteMutation.mutate(comment.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Reply input */}
              {replyTo === comment.id && (
                <div className="flex items-center gap-2 mt-2 ml-2">
                  <div className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center overflow-hidden shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-[10px] font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center bg-gray-100 rounded-full px-2.5 py-1">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Escreva uma resposta..."
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
                        className="text-[#1877F2] hover:text-blue-700"
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
                        className="shrink-0"
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden">
                          {reply.user.avatar ? (
                            <img src={reply.user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-gray-600">
                              {reply.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-100 rounded-2xl px-3 py-1.5">
                          <button
                            onClick={() => navigate(`/profile?id=${reply.userId}`)}
                            className="text-xs font-semibold text-gray-900 hover:underline"
                          >
                            {reply.user.name}
                          </button>
                          <p className="text-xs text-gray-800">{reply.content}</p>
                        </div>
                        {reply.userId === user?.id && (
                          <button
                            onClick={() => deleteMutation.mutate(reply.id)}
                            className="text-xs text-gray-400 hover:text-red-500 ml-2 mt-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
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
