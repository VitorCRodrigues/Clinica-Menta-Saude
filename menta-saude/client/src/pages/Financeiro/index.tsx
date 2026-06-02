import { useEffect, useState } from 'react'
import { listarFinanceiro, listarRepasses, atualizarFinanceiro, atualizarRepasse, listarAtendimentos, listarProfissionais } from '../../services/api'
import type { Financeiro, Repasse, Atendimento, Profissional, FormaPagamento } from '../../types'
import Carregando from '../../components/Carregando'
import BotaoPrimario from '../../components/BotaoPrimario'
import CampoSelect from '../../components/CampoSelect'

function formatarMoeda(valor?: number) {
  if (valor === undefined || valor === null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function formatarData(data?: string) {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

const rotuloForma: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_debito: 'Débito',
  cartao_credito: 'Crédito',
  transferencia: 'Transferência',
}

const corStatusPag: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  pago: 'bg-principal-claro text-principal',
  cancelado: 'bg-red-100 text-red-700',
}

const opcoesForma = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'cartao_debito', rotulo: 'Cartão Débito' },
  { valor: 'cartao_credito', rotulo: 'Cartão Crédito' },
  { valor: 'transferencia', rotulo: 'Transferência' },
]

type Aba = 'pagamentos' | 'repasses'

const formaPagamentoInicial = {
  atendimento_id: '',
  valor_recebido: '',
  forma_pagamento: 'pix',
  num_parcelas: '1',
  usar_segunda_forma: false,
  forma_pagamento_2: 'dinheiro',
  valor_pagamento_2: '',
  num_parcelas_2: '1',
  status_pagamento: 'pendente',
  data_pagamento: '',
  observacoes: '',
}

export default function FinanceiroPage() {
  const [aba, setAba] = useState<Aba>('pagamentos')
  const [registros, setRegistros] = useState<Financeiro[]>([])
  const [repasses, setRepasses] = useState<Repasse[]>([])
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [form, setForm] = useState(formaPagamentoInicial)
  const [salvando, setSalvando] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('')

  function carregarDados() {
    setCarregando(true)
    Promise.all([
      listarFinanceiro(filtroStatus ? { status_pagamento: filtroStatus } : {}),
      listarRepasses(),
      listarAtendimentos({ status: 'realizado' }),
      listarProfissionais(),
    ]).then(([f, r, a, p]) => {
      setRegistros(f)
      setRepasses(r as unknown as Repasse[])
      setAtendimentos(a)
      setProfissionais(p)
    }).finally(() => setCarregando(false))
  }

  useEffect(() => { carregarDados() }, [filtroStatus])

  async function salvarPagamento(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      const { criarFinanceiro } = await import('../../services/api')
      const vPag1 = Number(form.valor_recebido)
      const vPag2 = form.usar_segunda_forma ? Number(form.valor_pagamento_2) : 0

      await criarFinanceiro({
        atendimento_id: Number(form.atendimento_id),
        valor_recebido: vPag1,
        forma_pagamento: form.forma_pagamento as FormaPagamento,
        num_parcelas: Number(form.num_parcelas),
        forma_pagamento_2: form.usar_segunda_forma ? form.forma_pagamento_2 as FormaPagamento : undefined,
        valor_pagamento_2: vPag2 || undefined,
        num_parcelas_2: form.usar_segunda_forma ? Number(form.num_parcelas_2) : undefined,
        status_pagamento: form.status_pagamento as Financeiro['status_pagamento'],
        data_pagamento: form.data_pagamento || undefined,
        observacoes: form.observacoes || undefined,
      })
      setMostrarModal(false)
      setForm(formaPagamentoInicial)
      carregarDados()
    } finally {
      setSalvando(false)
    }
  }

  async function marcarPago(id: number, reg: Financeiro) {
    await atualizarFinanceiro(id, { ...reg, status_pagamento: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
    carregarDados()
  }

  async function marcarRepassePago(id: number) {
    await atualizarRepasse(id, { status: 'pago' })
    carregarDados()
  }

  const totalRecebido = registros.filter((r) => r.status_pagamento === 'pago').reduce((s, r) => s + r.valor_recebido, 0)
  const totalPendente = registros.filter((r) => r.status_pagamento === 'pendente').reduce((s, r) => s + r.valor_recebido, 0)
  const totalRepasses = repasses.filter((r) => r.status === 'pendente').reduce((s, r) => s + r.valor_repasse, 0)

  const vPag1Modal = Number(form.valor_recebido) || 0
  const vPag2Modal = form.usar_segunda_forma ? (Number(form.valor_pagamento_2) || 0) : 0
  const totalModal = vPag1Modal + vPag2Modal

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Financeiro</h2>
        <BotaoPrimario onClick={() => setMostrarModal(true)}>+ Registrar pagamento</BotaoPrimario>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Recebido</p>
          <p className="text-2xl font-bold text-primario">{formatarMoeda(totalRecebido)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">A receber</p>
          <p className="text-2xl font-bold text-yellow-600">{formatarMoeda(totalPendente)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Repasses pendentes</p>
          <p className="text-2xl font-bold text-orange-600">{formatarMoeda(totalRepasses)}</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {(['pagamentos', 'repasses'] as Aba[]).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              aba === a ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {aba === 'pagamentos' && (
        <>
          <div className="mb-3 w-48">
            <CampoSelect
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              opcoes={[
                { valor: 'pendente', rotulo: 'Pendente' },
                { valor: 'pago', rotulo: 'Pago' },
                { valor: 'cancelado', rotulo: 'Cancelado' },
              ]}
            />
          </div>
          {carregando ? <Carregando /> : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {registros.length === 0 ? (
                <div className="p-8 text-center text-gray-400">Nenhum registro financeiro.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Paciente</th>
                      <th className="px-4 py-3 text-left">Data consulta</th>
                      <th className="px-4 py-3 text-left">Total</th>
                      <th className="px-4 py-3 text-left">Formas</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Data pag.</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {registros.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{r.paciente_nome || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{formatarData(r.data_realizacao)}</td>
                        <td className="px-4 py-3 font-medium">{formatarMoeda(r.valor_recebido)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          <span>{rotuloForma[r.forma_pagamento || ''] || r.forma_pagamento || '—'}</span>
                          {r.num_parcelas > 1 && <span className="ml-1 text-gray-400">{r.num_parcelas}x</span>}
                          {r.forma_pagamento_2 && (
                            <span className="block text-gray-400">
                              + {rotuloForma[r.forma_pagamento_2] || r.forma_pagamento_2}
                              {r.valor_pagamento_2 ? ` (${formatarMoeda(r.valor_pagamento_2)})` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${corStatusPag[r.status_pagamento]}`}>
                            {r.status_pagamento}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatarData(r.data_pagamento)}</td>
                        <td className="px-4 py-3">
                          {r.status_pagamento === 'pendente' && (
                            <button
                              onClick={() => marcarPago(r.id, r)}
                              className="text-xs text-primario hover:underline font-medium"
                            >
                              Marcar pago
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {aba === 'repasses' && (
        carregando ? <Carregando /> : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {repasses.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Nenhum repasse registrado.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Profissional</th>
                    <th className="px-4 py-3 text-left">Paciente</th>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Bruto</th>
                    <th className="px-4 py-3 text-left">%</th>
                    <th className="px-4 py-3 text-left">Repasse</th>
                    <th className="px-4 py-3 text-left">Competência</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {repasses.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.profissional_nome || profissionais.find((p) => p.id === r.profissional_id)?.nome || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{r.paciente_nome || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{formatarData(r.data_realizacao)}</td>
                      <td className="px-4 py-3">{formatarMoeda(r.valor_bruto)}</td>
                      <td className="px-4 py-3 text-gray-500">{r.percentual_aplicado ? `${r.percentual_aplicado}%` : '—'}</td>
                      <td className="px-4 py-3 font-semibold text-principal">{formatarMoeda(r.valor_repasse)}</td>
                      <td className="px-4 py-3 text-gray-500">{r.competencia || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === 'pago' ? 'bg-principal-claro text-principal' : 'bg-yellow-100 text-yellow-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'pendente' && (
                          <button
                            onClick={() => marcarRepassePago(r.id)}
                            className="text-xs text-primario hover:underline font-medium"
                          >
                            Marcar pago
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      )}

      {/* Modal novo pagamento */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Registrar pagamento</h3>
            <form onSubmit={salvarPagamento} className="flex flex-col gap-3">
              <CampoSelect
                rotulo="Atendimento *"
                value={form.atendimento_id}
                onChange={(e) => setForm((f) => ({ ...f, atendimento_id: e.target.value }))}
                opcoes={atendimentos.map((a) => ({ valor: a.id, rotulo: `${a.paciente_nome} — ${formatarData(a.data_realizacao)}` }))}
              />

              {/* Forma de pagamento 1 */}
              <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Forma de pagamento 1</p>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_recebido}
                    onChange={(e) => setForm((f) => ({ ...f, valor_recebido: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CampoSelect
                    rotulo="Forma"
                    value={form.forma_pagamento}
                    onChange={(e) => setForm((f) => ({ ...f, forma_pagamento: e.target.value }))}
                    opcoes={opcoesForma}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      value={form.num_parcelas}
                      onChange={(e) => setForm((f) => ({ ...f, num_parcelas: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle segunda forma */}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.usar_segunda_forma}
                  onChange={(e) => setForm((f) => ({ ...f, usar_segunda_forma: e.target.checked }))}
                  className="rounded"
                />
                Adicionar segunda forma de pagamento
              </label>

              {/* Forma de pagamento 2 */}
              {form.usar_segunda_forma && (
                <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Forma de pagamento 2</p>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.valor_pagamento_2}
                      onChange={(e) => setForm((f) => ({ ...f, valor_pagamento_2: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <CampoSelect
                      rotulo="Forma"
                      value={form.forma_pagamento_2}
                      onChange={(e) => setForm((f) => ({ ...f, forma_pagamento_2: e.target.value }))}
                      opcoes={opcoesForma}
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Parcelas</label>
                      <input
                        type="number"
                        min="1"
                        value={form.num_parcelas_2}
                        onChange={(e) => setForm((f) => ({ ...f, num_parcelas_2: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Total */}
              {form.usar_segunda_forma && totalModal > 0 && (
                <div className="flex justify-between items-center bg-principal-claro rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-principal">Total recebido</span>
                  <span className="text-base font-bold text-principal">{formatarMoeda(totalModal)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <CampoSelect
                  rotulo="Status"
                  value={form.status_pagamento}
                  onChange={(e) => setForm((f) => ({ ...f, status_pagamento: e.target.value }))}
                  opcoes={[
                    { valor: 'pendente', rotulo: 'Pendente' },
                    { valor: 'pago', rotulo: 'Pago' },
                  ]}
                />
                {form.status_pagamento === 'pago' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Data do pagamento</label>
                    <input
                      type="date"
                      value={form.data_pagamento}
                      onChange={(e) => setForm((f) => ({ ...f, data_pagamento: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <BotaoPrimario type="button" variante="secundario" onClick={() => { setMostrarModal(false); setForm(formaPagamentoInicial) }}>
                  Cancelar
                </BotaoPrimario>
                <BotaoPrimario type="submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </BotaoPrimario>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
