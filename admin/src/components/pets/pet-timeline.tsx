import { useQuery } from '@tanstack/react-query'
import { getPetTimeline } from '../../services/timeline'

interface TimelineEvent {
  id: string
  type: string
  title: string
  description?: string
  eventDate: string
  vetName?: string
  clinicName?: string
  attachments: string[]
  petId: string
}

const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
  birth: { icon: '🎂', label: 'Nascimento', color: 'pink' },
  rescue: { icon: '🆘', label: 'Resgate', color: 'orange' },
  vaccine: { icon: '💉', label: 'Vacina', color: 'blue' },
  castration: { icon: '⚕️', label: 'Castração', color: 'purple' },
  exam: { icon: '🔬', label: 'Exame', color: 'teal' },
  surgery: { icon: '🏥', label: 'Cirurgia', color: 'red' },
  adoption: { icon: '🏡', label: 'Adoção', color: 'green' },
  treatment: { icon: '💊', label: 'Tratamento', color: 'amber' },
  checkup: { icon: '🩺', label: 'Check-up', color: 'cyan' },
}

interface PetTimelineProps {
  petId: string
}

export function PetTimeline({ petId }: PetTimelineProps) {
  const { data: events, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['pet-timeline', petId],
    queryFn: () => getPetTimeline(petId),
  })

  if (isLoading) {
    return <div className="text-gray-500 dark:text-gray-400 text-sm py-4">Carregando histórico...</div>
  }

  if (!events?.length) {
    return (
      <div className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">
        Nenhum evento registrado na timeline
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📋 Histórico do Pet</h3>
      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-6">
          {events.map((event) => {
            const cfg = typeConfig[event.type] || { icon: '📌', label: 'Outro', color: 'gray' }
            const date = new Date(event.eventDate).toLocaleDateString('pt-BR')

            return (
              <div key={event.id} className="relative pl-10">
                <div
                  className="absolute left-[11px] w-[18px] h-[18px] rounded-full border-2 border-white dark:border-gray-900 shadow-sm flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: `var(--color-${cfg.color}-100)` }}
                >
                  {cfg.icon}
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{event.title}</p>
                  {event.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{event.description}</p>
                  )}
                  {event.vetName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">👨‍⚕️ {event.vetName}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
