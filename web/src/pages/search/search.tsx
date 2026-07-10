import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { User } from '../../types'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''

  const { data, isLoading } = useQuery<{ users: User[]; total: number }>({
    queryKey: ['user-search', query],
    queryFn: async () => {
      const { data } = await api.get('/users/search', { params: { q: query, limit: 50 } })
      return data
    },
    enabled: !!query,
  })

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Pesquisar</h1>
      <p className="text-sm text-gray-500 mb-4">
        Resultados para: <strong>"{query}"</strong>
      </p>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Buscando...</div>
      ) : !data?.users.length ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500">Nenhum usuário encontrado</p>
          <p className="text-sm text-gray-400 mt-1">Tente um nome diferente</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          {data.users.map((u) => (
            <button
              key={u.id}
              onClick={() => navigate(`/profile?id=${u.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center overflow-hidden shrink-0">
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
