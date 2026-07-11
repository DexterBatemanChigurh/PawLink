import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { Avatar } from '../ui/avatar'
import { PawPrint, Home, MessageCircle, Search, ClipboardList } from 'lucide-react'

const LINKS = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/explorar', icon: Search, label: 'Encontrar Pets' },
  { path: '/conversations', icon: MessageCircle, label: 'Conversas' },
  { path: '/my-pets', icon: PawPrint, label: 'Meus Pets' },
]

export function LeftSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="hidden lg:block w-[280px] shrink-0">
      <div className="fixed top-14 w-[280px] h-[calc(100vh-56px)] overflow-y-auto scrollbar-thin py-4 px-3">
        {/* User card */}
        <div
          onClick={() => navigate('/profile')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/profile') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors mb-2"
        >
          <Avatar src={user?.avatar} name={user?.name || ''} size="md" />
          <span className="text-sm font-semibold text-gray-900 truncate">{user?.name}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 my-2" />

        {/* Navigation links */}
        <nav className="space-y-0.5">
          {LINKS.map((link) => {
            const active = isActive(link.path)
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  active
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <link.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-500'}`} />
                {link.label}
              </button>
            )
          })}
        </nav>

        {/* Shortcuts */}
        <div className="border-t border-gray-300 my-3 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">Atalhos</p>
          <div className="space-y-0.5">
            <button
              onClick={() => navigate('/matches/received')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <ClipboardList className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
              </div>
              Solicitações Recebidas
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
