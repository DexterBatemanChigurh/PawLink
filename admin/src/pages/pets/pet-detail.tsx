import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { PetTimeline } from '../../components/pets/pet-timeline'
import { Button } from '../../components/ui/button'
import type { Pet } from '../../types'

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: pet, isLoading } = useQuery<Pet>({
    queryKey: ['pet', id],
    queryFn: async () => {
      const { data } = await api.get(`/pets/${id}`)
      return data
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="text-gray-500">Carregando...</div>
  if (!pet) return <div className="text-gray-500">Pet não encontrado</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
        <Button variant="outline">Editar Pet</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-48 bg-gray-100 flex items-center justify-center text-5xl">
              🐾
            </div>
            <div className="p-4 space-y-2">
              <p><strong>Espécie:</strong> {pet.species}</p>
              {pet.breed && <p><strong>Raça:</strong> {pet.breed}</p>}
              {pet.age && <p><strong>Idade:</strong> {pet.age} anos</p>}
              {pet.size && <p><strong>Porte:</strong> {pet.size}</p>}
              <p>
                <strong>Status:</strong>{' '}
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  pet.status === 'available' ? 'bg-green-100 text-green-700' :
                  pet.status === 'adopted' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {pet.status === 'available' ? 'Disponível' : pet.status === 'adopted' ? 'Adotado' : 'Em tratamento'}
                </span>
              </p>
              {pet.city && <p><strong>Local:</strong> {pet.city}{pet.state ? `, ${pet.state}` : ''}</p>}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <PetTimeline petId={pet.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
