import type { User } from '../../types'
import { Info, Mail, Phone, Calendar, Shield } from 'lucide-react'
import { ROLE_LABEL } from '../../types/constants'

interface ProfileAboutProps {
  user: User
}

export function ProfileAbout({ user }: ProfileAboutProps) {
  return (
    <div className="grid grid-cols-2 gap-6 max-w-[680px]">
      {user.bio && (
        <div className="col-span-2">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Info className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Bio</p>
              <p className="text-sm text-gray-900 mt-0.5">{user.bio}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <Mail className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-gray-500 font-medium">Email</p>
          <p className="text-sm text-gray-900 mt-0.5">{user.email}</p>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <Phone className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-gray-500 font-medium">Telefone</p>
          <p className="text-sm text-gray-900 mt-0.5">{user.phone || '-'}</p>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-gray-500 font-medium">Membro desde</p>
          <p className="text-sm text-gray-900 mt-0.5">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <Shield className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-gray-500 font-medium">Tipo de conta</p>
          <p className="text-sm text-gray-900 mt-0.5 capitalize">{ROLE_LABEL[user.role] || user.role}</p>
        </div>
      </div>
    </div>
  )
}
