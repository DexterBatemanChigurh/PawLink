import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useToastStore } from '../../store/toast.store'
import { useConfirmStore } from '../../store/confirm.store'
import { Skeleton } from '../../components/ui/skeleton'
import { Shield, Eye, MessageCircle, Bell, AlertTriangle } from 'lucide-react'

const visibilityOptions = [
  { value: 'public', label: 'Público', desc: 'Todos podem ver seus posts' },
  { value: 'followers', label: 'Seguidores', desc: 'Apenas seguidores podem ver seus posts' },
  { value: 'private', label: 'Privado', desc: 'Apenas você pode ver seus posts' },
]

const messageOptions = [
  { value: 'everyone', label: 'Todos', desc: 'Qualquer um pode enviar mensagens' },
  { value: 'followers', label: 'Seguidores', desc: 'Apenas seguidores podem enviar mensagens' },
  { value: 'nobody', label: 'Ninguém', desc: 'Ninguém pode enviar mensagens' },
]

export function SettingsPage() {
  const { user, logout } = useAuthStore()
  const toast = useToastStore()
  const confirm = useConfirmStore()
  const navigate = useNavigate()
  const [postVisibility, setPostVisibility] = useState('public')
  const [messagePrivacy, setMessagePrivacy] = useState('everyone')
  const [notificationPush, setNotificationPush] = useState(true)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (user?.settings) {
      setPostVisibility(user.settings.postVisibility || 'public')
      setMessagePrivacy(user.settings.messagePrivacy || 'everyone')
      setNotificationPush(user.settings.notificationPush ?? true)
    }
    setLoaded(true)
  }, [user])

  const saveMutation = useMutation({
          mutationFn: async (data: Record<string, string>) => {
      await api.patch('/users/me/settings', data)
    },
    onSuccess: () => {
      toast.add('Configurações salvas!', 'success')
    },
    onError: () => {
      toast.add('Erro ao salvar configurações', 'error')
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/me')
    },
    onSuccess: () => {
      logout()
      navigate('/login')
    },
    onError: () => {
      toast.add('Erro ao excluir conta', 'error')
    },
  })

  if (!loaded) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>

      {/* Privacy */}
      <section className="bg-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Privacidade</h2>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visibilidade dos posts</label>
            </div>
            <div className="space-y-2">
              {visibilityOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    postVisibility === opt.value
                      ? 'bg-primary-light dark:bg-primary-light/10 border border-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="postVisibility"
                    value={opt.value}
                    checked={postVisibility === opt.value}
                    onChange={(e) => setPostVisibility(e.target.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{opt.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quem pode enviar mensagens</label>
            </div>
            <div className="space-y-2">
              {messageOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    messagePrivacy === opt.value
                      ? 'bg-primary-light dark:bg-primary-light/10 border border-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="messagePrivacy"
                    value={opt.value}
                    checked={messagePrivacy === opt.value}
                    onChange={(e) => setMessagePrivacy(e.target.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{opt.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notificações</h2>
        </div>
        <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Notificações push</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Receber notificações mesmo com o app fechado</p>
          </div>
          <input
            type="checkbox"
            checked={notificationPush}
            onChange={(e) => setNotificationPush(e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
        </label>
      </section>

      <button
        onClick={() => saveMutation.mutate({ postVisibility, messagePrivacy, notificationPush })}
        disabled={saveMutation.isPending}
        className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
      >
        {saveMutation.isPending ? 'Salvando...' : 'Salvar configurações'}
      </button>

      {/* Zona de Perigo */}
      <section className="bg-card rounded-lg shadow-sm border border-red-200 dark:border-red-900/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Zona de Perigo</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          A exclusão da conta é irreversível. Todos os seus dados, posts, pets e histórico serão permanentemente removidos.
        </p>
        <button
          onClick={() => confirm.show({
            title: 'Excluir conta',
            message: 'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
            variant: 'danger',
            confirmLabel: 'Excluir minha conta',
            onConfirm: () => deleteAccountMutation.mutate(),
          })}
          disabled={deleteAccountMutation.isPending}
          className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {deleteAccountMutation.isPending ? 'Excluindo...' : 'Excluir minha conta'}
        </button>
      </section>
    </div>
  )
}
