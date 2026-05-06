import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarDashboard } from '../../services/api'
import type { DashboardData } from '../../types'
import Carregando from '../../components/Carregando'

const rotuloStatus: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
}

const corStatus: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-green-100 text-green-700',
  realizado: 'bg-principal-claro text-principal',
  cancelado: 'bg-red-100 text-red-700',
  faltou: 'bg-yellow-100 text-yellow-700',
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function calcularIdade(dataNasc: string) {
  const hoje = new Date()
  const nasc = new Date(dataNasc + 'T00:00:00')
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export default function Dashboard() {
  const [dados, setDados] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarDashboard()
      .then(setDados)
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <Carregando />

  if (!dados) return (
    <div className="p-8">
      <p className="text-red-600">Erro ao carregar o dashboard.</p>
    </div>
  )

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Atendimentos hoje</p>
          <p className="text-3xl font-bold text-principal">{dados.atendimentos_hoje}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Recebido hoje</p>
          <p className="text-3xl font-bold text-primario">{formatarMoeda(dados.recebido_hoje)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-2">Status de hoje</p>
          <div className="flex flex-wrap gap-2">
            {dados.status_hoje.length === 0 && <span className="text-gray-400 text-sm">Nenhum</span>}
            {dados.status_hoje.map((s) => (
              <span key={s.status} className={`text-xs px-2 py-1 rounded-full font-medium ${corStatus[s.status] || 'bg-gray-100 text-gray-600'}`}>
                {rotuloStatus[s.status] || s.status}: {s.quantidade}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aniversariantes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Aniversariantes (próximos 7 dias)</h3>
          {dados.aniversariantes.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum aniversariante</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {dados.aniversariantes.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <Link to={`/pacientes/${p.id}`} className="text-sm font-medium text-principal hover:underline">
                      {p.nome}
                    </Link>
                    <p className="text-xs text-gray-400">{formatarData(p.data_nascimento)} — {calcularIdade(p.data_nascimento)} anos</p>
                  </div>
                  {p.telefone && (
                    <span className="text-xs text-gray-500">{p.telefone}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Repasses pendentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Repasses pendentes</h3>
          {dados.repasses_pendentes.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum repasse pendente</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {dados.repasses_pendentes.map((r) => (
                <li key={r.profissional_id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.profissional_nome}</p>
                    <p className="text-xs text-gray-400">{r.quantidade} repasse(s)</p>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">{formatarMoeda(r.total_pendente)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sem consulta há 6+ meses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-700 mb-4">Pacientes sem consulta há 6+ meses</h3>
          {dados.sem_consulta.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum paciente nesta situação</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                    <th className="pb-2 pr-4">Nome</th>
                    <th className="pb-2 pr-4">Telefone</th>
                    <th className="pb-2">Última consulta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dados.sem_consulta.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-4">
                        <Link to={`/pacientes/${p.id}`} className="text-principal hover:underline font-medium">
                          {p.nome}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500">{p.telefone || '—'}</td>
                      <td className="py-2.5 text-gray-500">
                        {p.ultima_consulta ? formatarData(p.ultima_consulta) : 'Nunca'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
