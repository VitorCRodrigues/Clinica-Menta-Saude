import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string
  erro?: string
}

export default function CampoTexto({ rotulo, erro, className = '', id, ...props }: Props) {
  const campoId = id || rotulo?.toLowerCase().replace(/\s/g, '_')
  return (
    <div className="flex flex-col gap-1">
      {rotulo && (
        <label htmlFor={campoId} className="text-sm font-medium text-gray-700">
          {rotulo}
        </label>
      )}
      <input
        id={campoId}
        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent ${
          erro ? 'border-red-400' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {erro && <span className="text-xs text-red-600">{erro}</span>}
    </div>
  )
}
