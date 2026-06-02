import { useEffect, useState } from 'react'
import { buscarRelatorios } from '../../services/api'
import type { RelatorioData } from '../../types'
import Carregando from '../../components/Carregando'

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function Relatorios() {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [dados, setDados] = useState<RelatorioData | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  function carregar() {
    setCarregando(true)
    setErro('')
    buscarRelatorios({ mes, ano })
      .then(setDados)
      .catch(() => setErro('Erro ao carregar relatório'))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { carregar() }, [mes, ano])

  const anos = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - i)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Relatórios</h2>
        <div className="flex gap-3 items-center">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario"
          >
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {erro && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{erro}</div>}

      {carregando ? <Carregando /> : dados && (
        <div className="flex flex-col gap-6">
          {/* Cards resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 uppercase mb-1">Pacientes novos</p>
              <p className="text-3xl font-bold text-primario">{dados.pacientes_novos}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 uppercase mb-1">Consultas realizadas</p>
              <p className="text-3xl font-bold text-gray-800">{dados.consultas_realizadas}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 uppercase mb-1">Retornos</p>
              <p className="text-3xl font-bold text-principal">{dados.retornaram}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 uppercase mb-1">Receita total</p>
              <p className="text-2xl font-bold text-primario">{formatarMoeda(dados.receita_total)}</p>
            </div>
          </div>

          {/* Consultas por procedimento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Consultas por procedimento</h3>
              {dados.por_procedimento.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma consulta no período.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {dados.por_procedimento.map((p, i) => {
                    const total = dados.por_procedimento.reduce((s, x) => s + x.quantidade, 0)
                    const pct = total > 0 ? Math.round((p.quantidade / total) * 100) : 0
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{p.procedimento || 'Sem procedimento'}</span>
                          <span className="text-gray-500 font-medium">{p.quantidade} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-principal rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Consultas por dia (gráfico simples) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Consultas por dia</h3>
              {dados.consultas_por_dia.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma consulta no período.</p>
              ) : (
                <div className="flex items-end gap-1 h-32">
                  {(() => {
                    const max = Math.max(...dados.consultas_por_dia.map((d) => d.quantidade))
                    return dados.consultas_por_dia.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.data}: ${d.quantidade}`}>
                        <div
                          className="w-full bg-principal rounded-t"
                          style={{ height: `${max > 0 ? (d.quantidade / max) * 100 : 0}%`, minHeight: '2px' }}
                        />
                        {dados.consultas_por_dia.length <= 15 && (
                          <span className="text-[9px] text-gray-400 rotate-45 origin-left">
                            {d.data.split('-')[2]}
                          </span>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Repasses por dentista */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Repasses por dentista — {MESES[mes - 1]} {ano}</h3>
            {dados.repasses_por_dentista.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum repasse no período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                  <tr>
                    <th className="text-left py-2 pr-4">Profissional</th>
                    <th className="text-left py-2 pr-4">Atendimentos</th>
                    <th className="text-left py-2 pr-4">Total bruto</th>
                    <th className="text-left py-2 pr-4">Total repasse</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dados.repasses_por_dentista.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 font-medium">{r.profissional}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{r.quantidade}</td>
                      <td className="py-2.5 pr-4">{formatarMoeda(r.total_bruto)}</td>
                      <td className="py-2.5 pr-4 font-semibold text-principal">{formatarMoeda(r.total_repasse)}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === 'pago' ? 'bg-principal-claro text-principal' : 'bg-yellow-100 text-yellow-700'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
