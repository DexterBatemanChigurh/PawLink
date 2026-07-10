import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import type { Pet } from '../../types'
import { Plus, Trash2 } from 'lucide-react'

export function MyPetsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: pets, isLoading } = useQuery<Pet[]>({
    queryKey: ['my-pets'],
    queryFn: async () => {
      const { data } = await api.get('/pets/my/me')
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (petId: string) => {
      await api.delete(`/pets/${petId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pets'] })
    },
  })

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Meus Pets</h1>
        <button
          onClick={() => navigate('/pets/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1877F2] text-white rounded-lg text-sm font-medium hover:bg-[#166FE5]"
        >
          <Plus className="w-4 h-4" />
          Cadastrar
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Carregando...</div>
      ) : !pets?.length ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🐾</div>
          <p className="text-gray-500 mb-4">Você ainda não cadastrou nenhum pet</p>
          <button
            onClick={() => navigate('/pets/new')}
            className="px-6 py-2.5 bg-[#1877F2] text-white rounded-lg font-medium hover:bg-[#166FE5]"
          >
            Cadastrar meu primeiro pet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pets.map((pet) => (
            <div key={pet.id} className="relative group">
              <button
                onClick={() => navigate(`/pets/${pet.id}`)}
                className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
              >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {pet.photos?.[0] ? (
                    <img src={pet.photos[0]} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span>{pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : '🐾'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                    {pet.status === 'available' ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Disponível</span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Adotado</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{pet.breed || 'SRD'} · {pet.species === 'dog' ? 'Cachorro' : 'Gato'}</p>
                  {pet.city && <p className="text-xs text-gray-400">{pet.city}{pet.state ? `, ${pet.state}` : ''}</p>}
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Tem certeza que deseja excluir este pet?')) deleteMutation.mutate(pet.id) }}
              className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          ))}
        </div>
      )}

      {pets && pets.length > 0 && (
        <p className="text-center text-sm text-gray-400 mt-6">{pets.length} pet(s) cadastrado(s)</p>
      )}
    </>
  )
}
