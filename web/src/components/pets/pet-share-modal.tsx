import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Share2 } from 'lucide-react'
import api from '../../services/api'
import { useToastStore } from '../../store/toast.store'
import { Avatar } from '../ui/avatar'
import type { Pet } from '../../types'
import { SPECIES_EMOJI, SPECIES_LABEL } from '../../types/constants'

interface PetShareModalProps {
  pet: Pet
  onClose: () => void
  onShared?: () => void
}

export function PetShareModal({ pet, onClose, onShared }: PetShareModalProps) {
  const queryClient = useQueryClient()
  const toast = useToastStore()
  const [message, setMessage] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/posts', {
        content: message.trim() || `Conheçam ${pet.name}! 🐾`,
        type: 'adoption_drive',
        petId: pet.id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.add('Pet compartilhado no feed!', 'success')
      onShared?.()
      onClose()
    },
    onError: () => {
      toast.add('Erro ao compartilhar pet', 'error')
    },
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      aria-label="Fechar"
    >
      <div
        className="bg-card rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Compartilhar Pet</h3>
          <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
              {pet.photos?.[0] ? (
                <img src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{SPECIES_EMOJI[pet.species] || '🐾'}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{pet.name}</p>
              <p className="text-xs text-gray-500">
                {SPECIES_LABEL[pet.species] || pet.species}
                {pet.breed ? ` · ${pet.breed}` : ' · SRD'}
              </p>
              {pet.city && (
                <p className="text-xs text-gray-400">{pet.city}{pet.state ? `, ${pet.state}` : ''}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
              Diga algo (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Ajude ${pet.name} a encontrar um lar!`}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none resize-none focus:border-primary"
              rows={3}
            />
          </div>

          {mutation.isError && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              Erro ao compartilhar. Tente novamente.
            </div>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {mutation.isPending ? 'Compartilhando...' : 'Compartilhar no Feed'}
          </button>
        </div>
      </div>
    </div>
  )
}
