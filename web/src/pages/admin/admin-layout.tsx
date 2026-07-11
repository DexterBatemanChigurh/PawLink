import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { LayoutDashboard, Flag, Users, LogOut, PawPrint } from 'lucide-react'

const SIDEBAR_LINKS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/reports', icon: Flag, label: 'Denúncias' },
  { path: '/admin/users', icon: Users, label: 'Usuários' },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-700">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <PawPrint className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg">PawLink Admin</span>
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {SIDEBAR_LINKS.map((link) => {
            const active = location.pathname === link.path
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  active
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-700 space-y-1">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">
            {user?.name} ({user?.email})
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <PawPrint className="w-4 h-4" />
            Voltar ao app
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white shadow-sm border-b border-gray-200 flex items-center px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">
            {SIDEBAR_LINKS.find((l) => location.pathname === l.path)?.label || 'Admin'}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
