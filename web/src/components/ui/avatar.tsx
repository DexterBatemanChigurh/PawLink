interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

const sizes = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-sm',
}

export function Avatar({ src, name, size = 'md', className = '', onClick }: AvatarProps) {
  const sizeClass = sizes[size]
  const Comp = onClick ? 'button' : 'div'

  return (
    <Comp
      onClick={onClick}
      className={`${sizeClass} rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      aria-label={onClick ? `Ver perfil de ${name}` : undefined}
    >
      {src ? (
        <img loading="lazy" decoding="async" src={src} alt={`Avatar de ${name}`} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </Comp>
  )
}
