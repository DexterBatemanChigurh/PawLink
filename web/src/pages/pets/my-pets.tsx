import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useConfirmStore } from '../../store/confirm.store'
import { useToastStore } from '../../store/toast.store'
import type { MyPetsResponse, Pet } from '../../types'
import { PetCardSkeleton } from '../../components/ui/skeleton'
import { EmptyState } from '../../components/ui/empty-state'
import { QueryState } from '../../components/ui/query-state'
import { Plus, Trash2, PawPrint } from 'lucide-react'
import { SPECIES_EMOJI, SPECIES_LABEL } from '../../types/constants'

function PetItem({ pet, owned }: { pet: Pet; owned: boolean }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const confirm = useConfirmStore()
  const toast = useToastStore()

  const deleteMutation = useMutation({
    mutationFn: async (petId: string) => {
      await api.delete(`/pets/${petId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pets'] })
      toast.add('Pet excluído com sucesso', 'success')
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Erro ao excluir pet. Tente novamente.'
      toast.add(msg, 'error')
    },
  })

  return (
    <div className="relative group">
      <button
        onClick={() => navigate(`/pets/${pet.id}`)}
        className="w-full bg-card rounded-lg shadow-sm border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {pet.photos?.[0] ? (
              <img loading="lazy" decoding="async" src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span>{SPECIES_EMOJI[pet.species] || '🐾'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{pet.name}</h3>
              {owned ? (
                pet.status === 'available' ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Disponível</span>
                ) : (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Adotado</span>
                )
              ) : (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Adotado por você</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{pet.breed || 'SRD'} · {SPECIES_LABEL[pet.species] || pet.species}</p>
            {pet.city && <p className="text-xs text-gray-400">{pet.city}{pet.state ? `, ${pet.state}` : ''}</p>}
          </div>
          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
      {owned && (
        <button
          onClick={(e) => { e.stopPropagation(); confirm.show({ title: 'Excluir pet', message: 'Tem certeza que deseja excluir este pet?', variant: 'danger', confirmLabel: 'Excluir', onConfirm: () => deleteMutation.mutate(pet.id) }) }}
          aria-label={`Excluir ${pet.name}`}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 dark:bg-gray-800/80 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export function MyPetsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'owned' | 'adopted'>('owned')

  const { data, isLoading, isError, error } = useQuery<MyPetsResponse>({
    queryKey: ['my-pets'],
    queryFn: async () => {
      const { data } = await api.get('/pets/my/me')
      return data
    },
  })

  const pets = data
  const currentList = tab === 'owned' ? pets?.owned : pets?.adopted
  const showEmpty = !pets || (tab === 'owned' ? !pets.owned.length : !pets.adopted.length)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Meus Pets</h1>
        <button
          onClick={() => navigate('/pets/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Cadastrar
        </button>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab('owned')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            tab === 'owned'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Cadastrados{pets?.owned ? ` (${pets.owned.length})` : ''}
        </button>
        <button
          onClick={() => setTab('adopted')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            tab === 'adopted'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Adotados{pets?.adopted ? ` (${pets.adopted.length})` : ''}
        </button>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error}
        loading={<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <PetCardSkeleton key={i} />)}</div>}
        isEmpty={showEmpty}
        empty={
          tab === 'owned'
            ? <EmptyState icon={PawPrint} title="Nenhum pet cadastrado" description="Você ainda não cadastrou nenhum pet." action={{ label: 'Cadastrar pet', onClick: () => navigate('/pets/new') }} />
            : <EmptyState icon={PawPrint} title="Nenhum pet adotado" description="Você ainda não adotou nenhum pet. Explore os pets disponíveis para adoção!" action={{ label: 'Explorar pets', onClick: () => navigate('/explorar') }} />
        }
      >
        <div className="space-y-3">
          {currentList?.map((pet) => (
            <PetItem key={pet.id} pet={pet} owned={tab === 'owned'} />
          ))}
        </div>

        {currentList && currentList.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-6">{currentList.length} pet(s)</p>
        )}
      </QueryState>
    </>
  )
}
