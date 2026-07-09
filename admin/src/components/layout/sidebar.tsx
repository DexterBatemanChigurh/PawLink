import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

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
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-600">PawLink</h1>
        <p className="text-sm text-gray-500">Painel Administrativo</p>
      </div>

      <nav className="px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100',
              )
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
