import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarAtendimentos, atualizarAtendimento } from '../../services/api'
import type { Atendimento } from '../../types'
import Carregando from '../../components/Carregando'
import BotaoPrimario from '../../components/BotaoPrimario'

function formatarMoeda(valor?: number) {
  if (!valor) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

const corStatus: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-green-100 text-green-700',
  realizado: 'bg-principal-claro text-principal',
  cancelado: 'bg-red-100 text-red-700',
  faltou: 'bg-yellow-100 text-yellow-700',
}

const statusOpcoes = ['agendado', 'confirmado', 'realizado', 'faltou', 'cancelado']

export default function Agenda() {
  const navigate = useNavigate()
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null)

  useEffect(() => {
    setCarregando(true)
    listarAtendimentos({ data })
      .then(setAtendimentos)
      .finally(() => setCarregando(false))
  }, [data])

  function mudarDia(delta: number) {
    const d = new Date(data + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setData(d.toISOString().split('T')[0])
  }

  async function alterarStatus(id: number, status: string) {
    setAtualizandoId(id)
    try {
      const atualizado = await atualizarAtendimento(id, { status: status as Atendimento['status'] })
      setAtendimentos((prev) => prev.map((a) => (a.id === id ? { ...a, status: atualizado.status } : a)))
    } finally {
      setAtualizandoId(null)
    }
  }

  const [dia, mes, ano] = data.split('-').reverse()
  const dataFormatada = `${dia}/${mes}/${ano}`

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Agenda</h2>
        <BotaoPrimario onClick={() => navigate('/agenda/novo')}>
          + Novo agendamento
        </BotaoPrimario>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => mudarDia(-1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          ←
        </button>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primario"
        />
        <span className="text-gray-600 font-medium">{dataFormatada}</span>
        <button onClick={() => mudarDia(1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          →
        </button>
        <button
          onClick={() => setData(new Date().toISOString().split('T')[0])}
          className="px-3 py-1.5 bg-principal-claro text-principal rounded-lg text-sm font-medium hover:bg-green-100"
        >
          Hoje
        </button>
      </div>

      {carregando ? (
        <Carregando />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {atendimentos.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum agendamento para este dia.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs text-gray-400 uppercase">
                  <th className="px-4 py-3">Horário</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {atendimentos.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.horario || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/pacientes/${a.paciente_id}`)}
                        className="text-principal hover:underline font-medium"
                      >
                        {a.paciente_nome}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.profissional_nome || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.servico_nome || '—'}</td>
                    <td className="px-4 py-3">{formatarMoeda(a.valor_cobrado)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        disabled={atualizandoId === a.id}
                        onChange={(e) => alterarStatus(a.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:ring-1 focus:ring-primario ${corStatus[a.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {statusOpcoes.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
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
