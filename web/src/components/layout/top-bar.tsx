import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth.store'
import api from '../../services/api'
import type { User, Conversation } from '../../types'
import { NotificationsDropdown } from './notifications-dropdown'
import {
  PawPrint,
  Search,
  Home,
  Grid3X3,
  MessageCircle,
  PlusCircle,
  LogOut,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/explorar', icon: Grid3X3, label: 'Explorar' },
]

export function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['conversations-topbar'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations')
      return data
    },
    refetchInterval: 15000,
  })

  const totalUnread = conversations?.reduce((s, c) => s + c.unreadCount, 0) || 0

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setSearchResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get('/users/search', { params: { q: value, limit: 5 } })
        setSearchResults(data.users || [])
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
    }
    if (e.key === 'Enter' && searchQuery.trim()) {
      setSearchOpen(false)
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSelectUser = (userId: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    navigate(`/profile?id=${userId}`)
  }

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#1877F2] shadow-md z-50">
      <div className="max-w-[1280px] mx-auto h-full px-2 sm:px-4 flex items-center justify-between gap-2">
        {/* Logo + Search */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-[#1877F2]" />
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">PawLink</span>
          </button>

          <div ref={searchRef} className="relative">
            <button
              onClick={openSearch}
              className="ml-1 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              title="Pesquisar pessoas"
            >
              <Search className="w-4 h-4" />
            </button>

            {searchOpen && (
              <div className="absolute left-0 top-full mt-1 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Pesquisar pessoas..."
                      className="w-full pl-10 pr-9 py-2 rounded-lg bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#1877F2]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(''); setSearchResults([]); inputRef.current?.focus() }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {searching ? (
                    <div className="px-4 py-6 text-sm text-gray-400 text-center">Buscando...</div>
                  ) : searchQuery && searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-400 text-center">Nenhum usuário encontrado</div>
                  ) : searchQuery ? (
                    <div>
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleSelectUser(u.id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center overflow-hidden shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xs font-semibold">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => { setSearchOpen(false); navigate(`/search?q=${encodeURIComponent(searchQuery)}`) }}
                        className="w-full px-4 py-2.5 text-sm text-[#1877F2] font-semibold hover:bg-gray-50 border-t border-gray-100 transition-colors text-center"
                      >
                        Ver todos os resultados
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-sm text-gray-400 text-center">
                      Digite o nome de uma pessoa
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center nav icons */}
        <nav className="hidden md:flex items-center h-full gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`h-full px-4 flex items-center justify-center relative transition-colors hover:bg-white/10 ${
                  isActive ? 'text-white' : 'text-white/70'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-t-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate('/pets/new')} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden lg:inline">Novo Pet</span>
          </button>

          <button
            onClick={() => navigate('/conversations')}
            className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            title="Mensagens"
          >
            <MessageCircle className="w-4 h-4" />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>

          <NotificationsDropdown />

          <div className="relative group">
            <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden hover:bg-white/30 transition-colors">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </button>
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2"
              >
                <PawPrint className="w-4 h-4" />
                Meu Perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
