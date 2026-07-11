import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useConfirmStore } from '../../store/confirm.store'
import { PetCardSkeleton } from '../../components/ui/skeleton'
import { QueryState } from '../../components/ui/query-state'
import type { Pet, TimelineEvent } from '../../types'
import { Heart, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Lightbox } from '../../components/ui/lightbox'
import { SPECIES_EMOJI, SPECIES_LABEL } from '../../types/constants'

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const confirm = useConfirmStore()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState('')
  const [interestError, setInterestError] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [galleryStart, setGalleryStart] = useState(0)
  const photos = pet?.photos || []

  const { data: pet, isLoading, isError, error } = useQuery<Pet>({
    queryKey: ['pet', id],
    queryFn: async () => {
      const { data } = await api.get(`/pets/${id}`)
      return data
    },
    enabled: !!id,
  })

  const { data: timeline } = useQuery<TimelineEvent[]>({
    queryKey: ['timeline', id],
    queryFn: async () => {
      const { data } = await api.get(`/pets/${id}/timeline`)
      return data
    },
    enabled: !!id,
  })

  const user = useAuthStore((s) => s.user)
  const isOwner = user?.id === pet?.ownerId

  const { data: isFavorited } = useQuery<boolean>({
    queryKey: ['favorite', id],
    queryFn: async () => {
      const { data } = await api.get(`/favorites/${id}`)
      return data
    },
    enabled: !!id,
  })

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        await api.delete(`/favorites/${id}`)
      } else {
        await api.post(`/favorites/${id}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', id] })
    },
  })

  const interestMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/matches/pets/${id}`, { message, phone })
      return data
    },
    onSuccess: () => {
      setShowForm(false)
      setMessage('')
      setPhone('')
      setInterestError('')
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
    onError: (err) => {
      const e = err as { response?: { status?: number; data?: { message?: string } } }
      const msg = e?.response?.data?.message
      if (e?.response?.status === 409) {
        setInterestError('Você já manifestou interesse neste pet')
      } else if (msg) {
        setInterestError(msg)
      } else {
        setInterestError('Erro ao enviar. Tente novamente.')
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/pets/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pets'] })
      navigate('/my-pets')
    },
  })

  const typeIcons: Record<string, string> = {
    rescue: '🆘', vaccine: '💉', treatment: '🩺', weight: '⚖️',
    castration: '🔬', microchip: '📌', checkup: '🏥', adoption: '🏡',
  }

  const typeColors: Record<string, string> = {
    rescue: 'bg-red-100 text-red-600',
    vaccine: 'bg-blue-100 text-blue-600',
    treatment: 'bg-yellow-100 text-yellow-600',
    weight: 'bg-purple-100 text-purple-600',
    castration: 'bg-pink-100 text-pink-600',
    microchip: 'bg-teal-100 text-teal-600',
    checkup: 'bg-green-100 text-green-600',
    adoption: 'bg-emerald-100 text-emerald-600',
  }

  if (isLoading) {
    return <PetCardSkeleton />
  }

  if (isError) {
    return (
      <QueryState isLoading={false} isError={true} error={error}>
        <div />
      </QueryState>
    )
  }

  if (!pet) {
    return <div className="text-gray-400 text-center py-20">Pet não encontrado</div>
  }

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="relative bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          {photos[0] ? (
            <img
              loading="lazy" decoding="async" src={photos[0]} alt={pet.name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxIndex(0)}
            />
          ) : (
            <span className="text-7xl opacity-40">{SPECIES_EMOJI[pet.species] || '🐾'}</span>
          )}
          {pet.status === 'available' && (
            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
              Disponível
            </span>
          )}
        </div>

        {photos.length > 1 && (
          <div className="relative px-4 py-3 border-t border-gray-100">
            <div className="flex gap-2 overflow-hidden">
              {photos.slice(galleryStart, galleryStart + 4).map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(galleryStart + i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    galleryStart + i === 0 ? 'border-primary' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img loading="lazy" decoding="async" src={url} alt={`${pet.name} ${galleryStart + i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {galleryStart > 0 && (
              <button
                onClick={() => setGalleryStart((p) => Math.max(0, p - 1))}
                aria-label="Fotos anteriores"
                className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center shadow hover:bg-white dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {galleryStart + 4 < photos.length && (
              <button
                onClick={() => setGalleryStart((p) => Math.min(photos.length - 4, p + 1))}
                aria-label="Próximas fotos"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center shadow hover:bg-white dark:hover:bg-gray-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{pet.name}</h2>
              <p className="text-gray-500">{SPECIES_LABEL[pet.species] || pet.species}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => favoriteMutation.mutate()}
                aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className={`p-2 rounded-lg transition-colors ${isFavorited ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500' : ''}`} />
              </button>
              {isOwner && (
                <>
                  <button onClick={() => navigate(`/pets/${pet.id}/edit`)} aria-label="Editar pet" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button onClick={() => confirm.show({ title: 'Excluir pet', message: `Tem certeza que deseja excluir ${pet?.name}?`, variant: 'danger', confirmLabel: 'Excluir', onConfirm: () => deleteMutation.mutate() })} aria-label="Excluir pet" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              {pet.status === 'available' ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Disponível</span>
              ) : (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">Indisponível</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm">🐶 {pet.breed || 'SRD'}</span>
            {pet.age && <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm">🎂 {pet.age} {pet.age === 1 ? 'ano' : 'anos'}</span>}
            {pet.city && <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm">📍 {pet.city}{pet.state ? `, ${pet.state}` : ''}</span>}
            {pet.castrated && <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm">Castrado</span>}
            {pet.vaccinated && <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm">Vacinado</span>}
          </div>

          {pet.temperament && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Temperamento</h3>
              <p className="text-gray-600 text-sm">{pet.temperament}</p>
            </div>
          )}

          {pet.story && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">História</h3>
              <p className="text-gray-600 text-sm">{pet.story}</p>
            </div>
          )}

          {pet.status === 'available' && !showForm && !isOwner && (
            <button
              onClick={() => { setShowForm(true); interestMutation.reset() }}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Quero Adotar!
            </button>
          )}

          {showForm && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Manifestar Interesse</h3>
              {interestError && <div className="text-red-600 text-sm">{interestError}</div>}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conte um pouco sobre você e por que deseja adotar..."
                aria-label="Mensagem de interesse"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                rows={3}
                maxLength={500}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefone para contato"
                aria-label="Telefone para contato"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setInterestError('') }}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => interestMutation.mutate()}
                  disabled={interestMutation.isPending}
                  className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
                >
                  {interestMutation.isPending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
              {interestMutation.isSuccess && (
                <div className="text-green-600 text-sm text-center">Interesse registrado com sucesso!</div>
              )}
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {timeline && timeline.length > 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-3">
            {timeline.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${typeColors[event.type] || 'bg-gray-100 text-gray-500'}`}>
                  {typeIcons[event.type] || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                  )}
                  {event.vetName && (
                    <p className="text-xs text-gray-400 mt-0.5">👨‍⚕️ {event.vetName}{event.clinicName ? ` - ${event.clinicName}` : ''}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
