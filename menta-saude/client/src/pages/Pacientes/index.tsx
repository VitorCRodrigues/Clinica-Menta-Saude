import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarPacientes } from '../../services/api'
import type { Paciente } from '../../types'
import Carregando from '../../components/Carregando'
import BotaoPrimario from '../../components/BotaoPrimario'
import CampoTexto from '../../components/CampoTexto'

const corStatus: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-600',
  aguardando: 'bg-yellow-100 text-yellow-700',
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setCarregando(true)
      listarPacientes({ busca })
        .then(setPacientes)
        .finally(() => setCarregando(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [busca])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pacientes</h2>
        <BotaoPrimario onClick={() => navigate('/pacientes/novo')}>
          + Novo paciente
        </BotaoPrimario>
      </div>

      <div className="mb-4 max-w-sm">
        <CampoTexto
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {carregando ? (
        <Carregando />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {pacientes.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum paciente encontrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs text-gray-400 uppercase">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pacientes.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-principal">{p.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{p.telefone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.origem || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${corStatus[p.status_retorno] || 'bg-gray-100 text-gray-600'}`}>
                        {p.status_retorno}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
