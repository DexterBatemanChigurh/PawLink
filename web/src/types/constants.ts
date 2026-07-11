export const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐇', hamster: '🐹', other: '🐾',
}

export const SPECIES_LABEL: Record<string, string> = {
  dog: 'Cachorro', cat: 'Gato', bird: 'Pássaro', rabbit: 'Coelho', hamster: 'Hamster', other: 'Outro',
}

export const ROLE_LABEL: Record<string, string> = {
  user: 'Usuário',
  ong: 'ONG',
  independent_rescuer: 'Resgatista',
  veterinary: 'Veterinário',
  petshop: 'Petshop',
  admin: 'Administrador',
}

export const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  veterinary: { label: 'Veterinário', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  petshop: { label: 'Petshop', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ong: { label: 'ONG', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  independent_rescuer: { label: 'Resgatista', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export const MATCH_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', reviewing: 'Em Análise', accepted: 'Aceito',
  rejected: 'Recusado', adopted: 'Adotado', cancelled: 'Cancelado',
}

export const MATCH_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', reviewing: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  adopted: 'bg-purple-100 text-purple-700', cancelled: 'bg-gray-100 text-gray-600',
}
