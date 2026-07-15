import { useNavigate } from 'react-router-dom'
import { Heart, PawPrint } from 'lucide-react'
import type { Pet } from '../../types'

interface ProfilePetsProps {
  pets: Pet[]
}

const speciesIcons: Record<string, typeof Heart> = {
  dog: Heart,
  cat: Heart,
  other: PawPrint,
}

export function ProfilePets({ pets }: ProfilePetsProps) {
  const navigate = useNavigate()

  if (pets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nenhum pet cadastrado</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {pets.map(pet => {
        const SpeciesIcon = speciesIcons[pet.species] || Heart
        return (
          <div
            key={pet.id}
            onClick={() => navigate(`/pets/${pet.id}`)}
            className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="aspect-square bg-gray-100 overflow-hidden">
              {pet.photos?.[0] ? (
                <img loading="lazy" decoding="async" src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <SpeciesIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{pet.name}</h3>
              {pet.breed && <p className="text-xs text-gray-500 truncate">{pet.breed}</p>}
              <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                pet.status === 'available'
                  ? 'bg-green-100 text-green-700'
                  : pet.status === 'adopted'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {pet.status === 'available' ? 'Disponível' : pet.status === 'adopted' ? 'Adotado' : 'Em processo'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
