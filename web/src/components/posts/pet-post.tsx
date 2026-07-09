import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, Syringe, Scissors } from 'lucide-react'
import type { Pet } from '../../types'

interface PetPostProps {
  pet: Pet
}

const speciesEmoji: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐇', hamster: '🐹', other: '🐾',
}

const speciesLabel: Record<string, string> = {
  dog: 'Cachorro', cat: 'Gato', bird: 'Pássaro', rabbit: 'Coelho', hamster: 'Hamster', other: 'Outro',
}

export function PetPost({ pet }: PetPostProps) {
  const navigate = useNavigate()

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="relative bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
        {pet.photos?.[0] ? (
          <img src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl opacity-40">{speciesEmoji[pet.species] || '🐾'}</span>
        )}
        {pet.status === 'available' && (
          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
            Disponível
          </span>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{pet.name}</h2>
            <p className="text-sm text-gray-500">
              {speciesLabel[pet.species] || pet.species}
              {pet.breed ? ` · ${pet.breed}` : ' · SRD'}
              {pet.age ? ` · ${pet.age} ${pet.age === 1 ? 'ano' : 'anos'}` : ''}
            </p>
          </div>
          <span className="text-3xl">{speciesEmoji[pet.species] || '🐾'}</span>
        </div>

        {(pet.city || pet.state) && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>{pet.city}{pet.state ? `, ${pet.state}` : ''}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {pet.castrated && (
            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
              <Scissors className="w-3 h-3" /> Castrado
            </span>
          )}
          {pet.vaccinated && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full">
              <Syringe className="w-3 h-3" /> Vacinado
            </span>
          )}
          {pet.temperament && (
            <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
              {pet.temperament}
            </span>
          )}
        </div>

        {pet.story && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {pet.story}
          </p>
        )}

        {pet.owner?.name && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">
              {pet.owner.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-500">
              Tutor: <span className="font-medium text-gray-700">{pet.owner.name}</span>
            </span>
          </div>
        )}

        <button
          onClick={() => navigate(`/pets/${pet.id}`)}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Heart className="w-5 h-5" />
          Quero Adotar!
        </button>
      </div>
    </article>
  )
}
