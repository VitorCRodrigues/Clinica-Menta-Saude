import type { SelectHTMLAttributes } from 'react'

interface Opcao {
  valor: string | number
  rotulo: string
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo?: string
  opcoes: Opcao[]
  erro?: string
}

export default function CampoSelect({ rotulo, opcoes, erro, className = '', id, ...props }: Props) {
  const campoId = id || rotulo?.toLowerCase().replace(/\s/g, '_')
  return (
    <div className="flex flex-col gap-1">
      {rotulo && (
        <label htmlFor={campoId} className="text-sm font-medium text-gray-700">
          {rotulo}
        </label>
      )}
      <select
        id={campoId}
        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent bg-white ${
          erro ? 'border-red-400' : 'border-gray-300'
        } ${className}`}
        {...props}
      >
        <option value="">Selecione...</option>
        {opcoes.map((op) => (
          <option key={op.valor} value={op.valor}>
            {op.rotulo}
          </option>
        ))}
      </select>
      {erro && <span className="text-xs text-red-600">{erro}</span>}
    </div>
  )
}
