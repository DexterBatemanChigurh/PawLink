import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Button } from '../../components/ui/button'
import type { Pet } from '../../types'

export function PetsPage() {
  const navigate = useNavigate()
  const [species, setSpecies] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['pets', species],
    queryFn: async () => {
      const { data } = await api.get('/pets', {
        params: species ? { species } : {},
      })
      return data as { pets: Pet[]; total: number }
    },
  })

  const speciesIcons: Record<string, string> = {
    dog: '🐕',
    cat: '🐈',
    bird: '🐦',
    rabbit: '🐇',
    hamster: '🐹',
    other: '🐾',
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      adopted: 'bg-blue-100 text-blue-700',
      in_treatment: 'bg-yellow-100 text-yellow-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pets</h1>
        <Button>Cadastrar Pet</Button>
      </div>

      <div className="mb-4 flex gap-2">
        {['', 'dog', 'cat', 'bird', 'rabbit'].map((s) => (
          <button
            key={s}
            onClick={() => setSpecies(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              species === s
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? `${speciesIcons[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}s` : 'Todos'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && (
          <div className="col-span-full text-center py-12 text-gray-500">Carregando...</div>
        )}

        {data?.pets.map((pet) => (
          <div key={pet.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-40 bg-gray-100 flex items-center justify-center text-4xl">
              {pet.photos?.[0] ? (
                <img src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                speciesIcons[pet.species] || '🐾'
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(pet.status)}`}>
                  {pet.status === 'available' ? 'Disponível' : pet.status === 'adopted' ? 'Adotado' : 'Em tratamento'}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {pet.breed && <p>{pet.breed}</p>}
                {pet.age && <p>{pet.age} anos</p>}
                {pet.city && <p>📍 {pet.city}{pet.state ? `, ${pet.state}` : ''}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/pets/${pet.id}`)}>Ver</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/pets/${pet.id}/edit`)}>Editar</Button>
              </div>
            </div>
          </div>
        ))}

        {data?.pets.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum pet encontrado
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Total: {data?.total ?? 0} pets
      </div>
    </div>
  )
}
