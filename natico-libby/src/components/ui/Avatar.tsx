interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-violet-100 text-violet-700 font-semibold flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}

export function LibbyAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-12 h-12' }
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-violet-800 flex items-center justify-center flex-shrink-0`}
      title="Libby"
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Wizard hat brim */}
        <ellipse cx="18" cy="13" rx="10" ry="3" fill="#c4b5fd" />
        {/* Wizard hat cone */}
        <path d="M18 2 L25 13 L11 13 Z" fill="#7c3aed" />
        {/* Star on hat */}
        <circle cx="18" cy="7" r="1.2" fill="#fde68a" />
        {/* Face */}
        <circle cx="18" cy="20" r="8" fill="#fde8c8" />
        {/* Eyes */}
        <circle cx="15" cy="19" r="1.3" fill="#4c1d95" />
        <circle cx="21" cy="19" r="1.3" fill="#4c1d95" />
        {/* Beard */}
        <path
          d="M12 23 Q18 28 24 23"
          stroke="#e7e5e4"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M14 24 Q18 30 22 24"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Robe collar */}
        <path
          d="M10 28 Q18 32 26 28"
          stroke="#7c3aed"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
