import { useState } from 'react'
import { PawPrint, X } from 'lucide-react'

const steps = [
  {
    title: 'Bem-vindo ao PawLink!',
    description: 'Conecte-se com ONGs, veterinários e amantes de animais. Encontre seu novo melhor amigo!',
    icon: '🐾',
  },
  {
    title: 'Explore o feed',
    description: 'Veja posts de ONGs e clínicas, curta, comente e compartilhe conteúdo da comunidade.',
    icon: '📱',
  },
  {
    title: 'Adote um pet',
    description: 'Navegue pelos pets disponíveis, expresse interesse e encontre um novo companheiro.',
    icon: '🐶',
  },
  {
    title: 'Receba notificações',
    description: 'Ative as notificações para não perder matches, mensagens e atualizações importantes.',
    icon: '🔔',
  },
]

export function Onboarding() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pawlink-onboarding') === '1')
  const [step, setStep] = useState(0)

  if (dismissed) return null

  const current = steps[step]
  const isLast = step === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('pawlink-onboarding', '1')
      setDismissed(true)
    } else {
      setStep(step + 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('pawlink-onboarding', '1')
    setDismissed(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleSkip} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') handleSkip() }} aria-label="Fechar" />
      <div className="relative bg-card rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-sm w-full mx-4 text-center">
        <button onClick={handleSkip} aria-label="Pular tour" className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <div className="text-6xl mb-4">{current.icon}</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{current.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{current.description}</p>
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
        >
          {isLast ? 'Começar' : 'Próximo'}
        </button>
      </div>
    </div>
  )
}
