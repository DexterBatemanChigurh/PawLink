import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { PetTimeline } from '../../components/pets/pet-timeline'
import { Button } from '../../components/ui/button'
import type { Pet } from '../../types'

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: pet, isLoading } = useQuery<Pet>({
    queryKey: ['pet', id],
    queryFn: async () => {
      const { data } = await api.get(`/pets/${id}`)
      return data
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
  if (!pet) return <div className="text-gray-500 dark:text-gray-400">Pet não encontrado</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pet.name}</h1>
        <Button variant="info" onClick={() => navigate(`/pets/${id}/edit`)}>Editar Pet</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-5xl">
              🐾
            </div>
            <div className="p-4 space-y-2 text-gray-600 dark:text-gray-300">
              <p><strong>Espécie:</strong> {pet.species}</p>
              {pet.breed && <p><strong>Raça:</strong> {pet.breed}</p>}
              {pet.age && <p><strong>Idade:</strong> {pet.age} anos</p>}
              {pet.size && <p><strong>Porte:</strong> {pet.size}</p>}
              <p>
                <strong>Status:</strong>{' '}
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  pet.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                  pet.status === 'adopted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                }`}>
                  {pet.status === 'available' ? 'Disponível' : pet.status === 'adopted' ? 'Adotado' : 'Em tratamento'}
                </span>
              </p>
              {pet.city && <p><strong>Local:</strong> {pet.city}{pet.state ? `, ${pet.state}` : ''}</p>}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 p-6">
            <PetTimeline petId={pet.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
