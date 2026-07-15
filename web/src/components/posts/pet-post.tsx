import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Syringe, Scissors, MessageCircle, Share2 } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import type { Pet } from '../../types'
import { Avatar } from '../ui/avatar'
import { SPECIES_EMOJI, SPECIES_LABEL } from '../../types/constants'
import { PetShareModal } from '../pets/pet-share-modal'

interface PetPostProps {
  pet: Pet
}

export function PetPost({ pet }: PetPostProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.id === pet.ownerId
  const [showShare, setShowShare] = useState(false)

  return (
    <article className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header — like Facebook post header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Avatar src={pet.owner?.avatar} name={pet.owner?.name || '?'} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {pet.owner?.name || 'Tutor'}
          </p>
          <p className="text-xs text-gray-500">
            {pet.city}{pet.state ? `, ${pet.state}` : ''} · {new Date(pet.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        {pet.status === 'available' && (
          <span className="bg-green-500 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
            Disponível
          </span>
        )}
      </div>

      {/* Photo */}
      <div className="bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
        {pet.photos?.[0] ? (
          <img loading="lazy" decoding="async" src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl opacity-40">{SPECIES_EMOJI[pet.species] || '🐾'}</span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">{pet.name}</h2>
          <span className="text-xs text-gray-400">
            {SPECIES_LABEL[pet.species] || pet.species}
            {pet.breed ? ` · ${pet.breed}` : ' · SRD'}
            {pet.age ? ` · ${pet.age} ${pet.age === 1 ? 'ano' : 'anos'}` : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {pet.castrated && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
              <Scissors className="w-3 h-3" /> Castrado
            </span>
          )}
          {pet.vaccinated && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-green-50 text-green-600 px-2 py-0.5 rounded">
              <Syringe className="w-3 h-3" /> Vacinado
            </span>
          )}
          {pet.temperament && (
            <span className="text-[11px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded">
              {pet.temperament}
            </span>
          )}
        </div>

        {pet.story && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {pet.story}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex gap-2">
        <button
          onClick={() => setShowShare(true)}
          className="bg-gray-100 text-gray-600 hover:bg-gray-200 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 px-3"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar
        </button>
        {!isOwner && pet.status === 'available' && (
          <button
            onClick={() => navigate(`/pets/${pet.id}`)}
            className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5"
          >
            <Heart className="w-4 h-4" />
            Quero Adotar
          </button>
        )}
        <button
          onClick={() => navigate(`/pets/${pet.id}`)}
          className={`flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 ${isOwner || pet.status !== 'available' ? 'w-full' : ''}`}
        >
          <MessageCircle className="w-4 h-4" />
          {isOwner ? 'Ver detalhes' : 'Saber Mais'}
        </button>
      </div>

      {showShare && (
        <PetShareModal
          pet={pet}
          onClose={() => setShowShare(false)}
          onShared={() => setShowShare(false)}
        />
      )}
    </article>
  )
}
