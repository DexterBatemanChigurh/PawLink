import { NavLink, useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useThemeStore } from '../../store/theme.store'
import { useAuthStore } from '../../store/auth.store'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Usuários', path: '/users', icon: '👥' },
  { label: 'Pets', path: '/pets', icon: '🐾' },
  { label: 'Matches', path: '/matches', icon: '💚' },
  { label: 'ONGs', path: '/organizations', icon: '🏥' },
  { label: 'Denúncias', path: '/reports', icon: '🚨' },
  { label: 'Configurações', path: '/settings', icon: '⚙️' },
]

export function Sidebar() {
  const { isDark, toggle } = useThemeStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">PawLink</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Painel Administrativo</p>
      </div>

      <nav className="px-4 space-y-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
              )
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <p className="text-xs text-gray-400 px-3 mb-2 truncate">{user?.email}</p>
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}
