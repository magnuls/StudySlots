import { ReactNode } from 'react'

type Variant = 'pink' | 'mint' | 'gold'

const VARIANTS: Record<Variant, string> = {
  pink: 'bg-hotpink text-cream',
  mint: 'bg-mint text-plumdark',
  gold: 'bg-gold text-plumdark',
}

export default function PixelButton({
  variant = 'pink',
  onClick,
  children,
  disabled = false,
  className = '',
}: {
  variant?: Variant
  onClick?: () => void
  children: ReactNode
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`pixel-border no-drag select-none px-4 py-3 font-pixel text-[10px] uppercase tracking-wider transition-transform duration-100 hover:-translate-y-0.5 hover:scale-105 active:translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
