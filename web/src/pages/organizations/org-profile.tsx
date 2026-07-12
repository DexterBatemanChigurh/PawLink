import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Organization } from '../../types'
import { ORG_STATUS_LABEL, ORG_STATUS_COLOR } from '../../types/constants'
import { Skeleton } from '../../components/ui/skeleton'
import { Avatar } from '../../components/ui/avatar'
import { ArrowLeft, Building2, MapPin, Globe, Mail, Phone, CheckCircle, Clock, FileText } from 'lucide-react'

export function OrgProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data: org, isLoading, isError } = useQuery<Organization>({
    queryKey: ['org', slug],
    queryFn: async () => {
      const { data } = await api.get(`/organizations/slug/${slug}`)
      return data
    },
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="max-w-[940px] mx-auto">
        <Skeleton className="h-72 w-full rounded-b-lg mb-4" />
        <div className="px-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
      </div>
    )
  }

  if (isError || !org) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Organização não encontrada</h2>
        <p className="text-sm text-gray-500">Esta organização não existe ou foi removida.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary hover:underline">Voltar</button>
      </div>
    )
  }

  return (
    <div className="max-w-[940px] mx-auto">
      {/* Cover */}
      <div className="relative h-72 bg-gradient-to-r from-purple-500 to-purple-700 rounded-b-lg overflow-hidden">
        {org.coverPhoto && (
          <img loading="lazy" decoding="async" src={org.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Avatar + Info */}
      <div className="px-8">
        <div className="flex items-end -mt-16 mb-4">
          <Avatar
            src={org.avatar}
            name={org.name}
            size="lg"
            className="w-32 h-32 rounded-full border-4 border-white shadow-md shrink-0"
          />
          <div className="ml-4 mb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ORG_STATUS_COLOR[org.status]}`}>
                {ORG_STATUS_LABEL[org.status]}
              </span>
              {org.verified && (
                <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  <CheckCircle className="w-3 h-3" />
                  Verificada
                </span>
              )}
            </div>
            {org.city && org.state && (
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {org.city}, {org.state}
              </p>
            )}
          </div>
        </div>
      </div>

      <hr className="border-gray-300" />

      {/* Content */}
      <div className="px-8 py-6 max-w-[680px] space-y-6">
        {org.description && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Sobre</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{org.description}</p>
          </div>
        )}

        {org.mission && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Missão
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-400 italic">"{org.mission}"</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {org.email && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900 truncate">{org.email}</p>
              </div>
            </div>
          )}
          {org.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="text-sm text-gray-900 truncate">{org.phone}</p>
              </div>
            </div>
          )}
          {org.city && org.state && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Localização</p>
                <p className="text-sm text-gray-900">{org.city}, {org.state}</p>
              </div>
            </div>
          )}
          {org.website && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Site</p>
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                  {org.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
          <Clock className="w-3 h-3" />
          Criada em {new Date(org.createdAt).toLocaleDateString('pt-BR')}
          {' · '}
          CNPJ: {org.cnpj}
        </div>
      </div>
    </div>
  )
}
