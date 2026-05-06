import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'perigo'
  tamanho?: 'sm' | 'md' | 'lg'
}

const estilos = {
  primario: 'bg-primario hover:bg-primario-hover text-white',
  secundario: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
  perigo: 'bg-red-600 hover:bg-red-700 text-white',
}

const tamanhos = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function BotaoPrimario({ variante = 'primario', tamanho = 'md', className = '', children, ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${estilos[variante]} ${tamanhos[tamanho]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
