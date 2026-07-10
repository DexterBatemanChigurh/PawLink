import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import type { Pet, TimelineEvent } from '../../types'
import { Heart, Pencil, Trash2, ArrowLeft } from 'lucide-react'

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState('')

  const { data: pet, isLoading } = useQuery<Pet>({
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

  const interestMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/matches/pets/${id}`, { message, phone })
    },
    onSuccess: () => {
      setShowForm(false)
      setMessage('')
      setPhone('')
      queryClient.invalidateQueries({ queryKey: ['matches'] })
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
    return <div className="text-gray-400 text-center py-20">Carregando...</div>
  }

  if (!pet) {
    return <div className="text-gray-400 text-center py-20">Pet não encontrado</div>
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="relative bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          {pet.photos?.[0] ? (
            <img src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-7xl opacity-40">{pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : '🐾'}</span>
          )}
          {pet.status === 'available' && (
            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
              Disponível
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{pet.name}</h2>
              <p className="text-gray-500">{pet.species === 'dog' ? 'Cachorro' : pet.species === 'cat' ? 'Gato' : pet.species}</p>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <button onClick={() => navigate(`/pets/${pet.id}/edit`)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button onClick={() => { if (window.confirm(`Tem certeza que deseja excluir ${pet.name}?`)) deleteMutation.mutate() }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm">🐶 {pet.breed || 'SRD'}</span>
            {pet.age && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm">🎂 {pet.age} {pet.age === 1 ? 'ano' : 'anos'}</span>}
            {pet.city && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm">📍 {pet.city}{pet.state ? `, ${pet.state}` : ''}</span>}
            {pet.castrated && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm">Castrado</span>}
            {pet.vaccinated && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm">Vacinado</span>}
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

          {pet.status === 'available' && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-[#1877F2] text-white py-3 rounded-lg font-medium hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Quero Adotar!
            </button>
          )}

          {showForm && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Manifestar Interesse</h3>
              {interestMutation.isError && <div className="text-red-600 text-sm">Erro ao enviar. Tente novamente.</div>}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conte um pouco sobre você e por que deseja adotar..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none"
                rows={3}
                maxLength={500}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefone para contato"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => interestMutation.mutate()}
                  disabled={interestMutation.isPending}
                  className="flex-1 bg-[#1877F2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#166FE5] disabled:opacity-50"
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

      {timeline && timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
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
