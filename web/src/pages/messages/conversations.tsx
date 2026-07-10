import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Conversation } from '../../types'
import { ArrowLeft, MessageSquare } from 'lucide-react'

export function ConversationsPage() {
  const navigate = useNavigate()

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations')
      return data
    },
    refetchInterval: 10000,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Mensagens</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Carregando...</div>
        ) : !conversations?.length ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma conversa ativa</p>
            <p className="text-sm text-gray-400 mt-1">
              As conversas aparecem após o match ser aceito
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.matchId}
                onClick={() => navigate(`/messages/${conv.matchId}`)}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                    {conv.otherUserAvatar ? (
                      <img src={conv.otherUserAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      conv.otherUserName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.otherUserName}
                      </h3>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.petName} — {conv.lastMessage || 'Início da conversa'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
