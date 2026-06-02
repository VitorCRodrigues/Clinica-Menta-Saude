import { useEffect, useState } from 'react'
import {
  listarProfissionais, criarProfissional, atualizarProfissional,
  listarServicos, criarServico, atualizarServico,
  listarHorarios, atualizarHorario,
} from '../../services/api'
import type { Profissional, Servico, TipoRepasse, HorarioFuncionamento } from '../../types'
import BotaoPrimario from '../../components/BotaoPrimario'
import CampoTexto from '../../components/CampoTexto'
import CampoSelect from '../../components/CampoSelect'
import Carregando from '../../components/Carregando'

type Aba = 'profissionais' | 'servicos' | 'horarios'

function formatarMoeda(valor?: number) {
  if (!valor) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

const rotuloTipoRepasse: Record<TipoRepasse, string> = {
  percentual_por_procedimento: '% por procedimento',
  percentual_mensal: '% mensal (fechamento)',
  fixo_por_dente: 'Fixo por dente',
  diaria: 'Diária fixa',
}

const formProfInicial = {
  nome: '',
  especialidade: '',
  percentual_padrao: '',
  percentual_cartao: '',
  percentual_parcelado: '',
  observacoes: '',
  tipo_repasse: 'percentual_por_procedimento' as TipoRepasse,
  valor_diaria: '',
  regras_especiais: '',
}

export default function Configuracoes() {
  const [aba, setAba] = useState<Aba>('profissionais')
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [horarios, setHorarios] = useState<HorarioFuncionamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalProf, setModalProf] = useState(false)
  const [modalServ, setModalServ] = useState(false)
  const [profEditando, setProfEditando] = useState<Profissional | null>(null)
  const [servEditando, setServEditando] = useState<Servico | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [formProf, setFormProf] = useState(formProfInicial)
  const [formServ, setFormServ] = useState({ nome: '', valor_padrao: '', duracao_minutos: '' })

  function carregarDados() {
    setCarregando(true)
    Promise.all([listarProfissionais(), listarServicos(), listarHorarios()])
      .then(([p, s, h]) => { setProfissionais(p); setServicos(s); setHorarios(h) })
      .finally(() => setCarregando(false))
  }

  async function salvarHorario(h: HorarioFuncionamento) {
    const atualizados = await atualizarHorario(h.dia_semana, {
      hora_inicio: h.hora_inicio,
      hora_fim: h.hora_fim,
      ativo: h.ativo,
    })
    setHorarios(atualizados)
  }

  function editarHorario(dia: number, campo: keyof HorarioFuncionamento, valor: string | number) {
    setHorarios((prev) => prev.map((h) => h.dia_semana === dia ? { ...h, [campo]: valor } : h))
  }

  useEffect(() => { carregarDados() }, [])

  function abrirModalProf(prof?: Profissional) {
    setProfEditando(prof || null)
    setFormProf(prof ? {
      nome: prof.nome,
      especialidade: prof.especialidade || '',
      percentual_padrao: String(prof.percentual_padrao || ''),
      percentual_cartao: String(prof.percentual_cartao || ''),
      percentual_parcelado: String(prof.percentual_parcelado || ''),
      observacoes: prof.observacoes || '',
      tipo_repasse: (prof.tipo_repasse || 'percentual_por_procedimento') as TipoRepasse,
      valor_diaria: String(prof.valor_diaria || ''),
      regras_especiais: prof.regras_especiais || '',
    } : formProfInicial)
    setModalProf(true)
  }

  function abrirModalServ(serv?: Servico) {
    setServEditando(serv || null)
    setFormServ(serv ? {
      nome: serv.nome,
      valor_padrao: String(serv.valor_padrao || ''),
      duracao_minutos: String(serv.duracao_minutos || ''),
    } : { nome: '', valor_padrao: '', duracao_minutos: '' })
    setModalServ(true)
  }

  async function salvarProf(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      const dados: Partial<Profissional> = {
        nome: formProf.nome,
        especialidade: formProf.especialidade || undefined,
        observacoes: formProf.observacoes || undefined,
        tipo_repasse: formProf.tipo_repasse,
      }

      if (formProf.tipo_repasse === 'percentual_por_procedimento' || formProf.tipo_repasse === 'percentual_mensal') {
        dados.percentual_padrao = formProf.percentual_padrao ? Number(formProf.percentual_padrao) : undefined
        dados.percentual_cartao = formProf.percentual_cartao ? Number(formProf.percentual_cartao) : undefined
        dados.percentual_parcelado = formProf.percentual_parcelado ? Number(formProf.percentual_parcelado) : undefined
      } else if (formProf.tipo_repasse === 'fixo_por_dente') {
        dados.regras_especiais = formProf.regras_especiais || undefined
      } else if (formProf.tipo_repasse === 'diaria') {
        dados.valor_diaria = formProf.valor_diaria ? Number(formProf.valor_diaria) : undefined
      }

      if (profEditando) await atualizarProfissional(profEditando.id, dados)
      else await criarProfissional(dados)
      setModalProf(false)
      carregarDados()
    } finally {
      setSalvando(false)
    }
  }

  async function salvarServ(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      const dados = {
        nome: formServ.nome,
        valor_padrao: formServ.valor_padrao ? Number(formServ.valor_padrao) : undefined,
        duracao_minutos: formServ.duracao_minutos ? Number(formServ.duracao_minutos) : undefined,
      }
      if (servEditando) await atualizarServico(servEditando.id, dados)
      else await criarServico(dados)
      setModalServ(false)
      carregarDados()
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivoProfissional(prof: Profissional) {
    await atualizarProfissional(prof.id, { ...prof, ativo: prof.ativo ? 0 : 1 })
    carregarDados()
  }

  async function toggleAtivoServico(serv: Servico) {
    await atualizarServico(serv.id, { ...serv, ativo: serv.ativo ? 0 : 1 })
    carregarDados()
  }

  const tipo = formProf.tipo_repasse

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h2>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { id: 'profissionais', rotulo: 'Dentistas / Profissionais' },
          { id: 'servicos', rotulo: 'Serviços' },
          { id: 'horarios', rotulo: 'Horários' },
        ] as { id: Aba; rotulo: string }[]).map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              aba === a.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {carregando ? <Carregando /> : (
        <>
          {aba === 'profissionais' && (
            <div>
              <div className="flex justify-end mb-3">
                <BotaoPrimario onClick={() => abrirModalProf()}>+ Novo profissional</BotaoPrimario>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {profissionais.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Nenhum profissional cadastrado.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">Especialidade</th>
                        <th className="px-4 py-3 text-left">Tipo de repasse</th>
                        <th className="px-4 py-3 text-left">Valores</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {profissionais.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{p.nome}</td>
                          <td className="px-4 py-3 text-gray-500">{p.especialidade || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {rotuloTipoRepasse[p.tipo_repasse as TipoRepasse] || p.tipo_repasse || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {p.tipo_repasse === 'diaria' && p.valor_diaria
                              ? `${formatarMoeda(p.valor_diaria)}/dia`
                              : p.tipo_repasse === 'fixo_por_dente'
                              ? 'Tabela por dente'
                              : p.percentual_padrao
                              ? `${p.percentual_padrao}% padrão`
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.ativo ? 'bg-principal-claro text-principal' : 'bg-gray-100 text-gray-500'}`}>
                              {p.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => abrirModalProf(p)} className="text-xs text-principal hover:underline">Editar</button>
                              <button onClick={() => toggleAtivoProfissional(p)} className="text-xs text-gray-400 hover:underline">
                                {p.ativo ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {aba === 'horarios' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Dia</th>
                    <th className="px-4 py-3 text-left">Abertura</th>
                    <th className="px-4 py-3 text-left">Fechamento</th>
                    <th className="px-4 py-3 text-left">Aberto</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {horarios.map((h) => (
                    <tr key={h.dia_semana} className={`hover:bg-gray-50 ${!h.ativo ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-medium">{h.nome_dia}</td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={h.hora_inicio}
                          disabled={!h.ativo}
                          onChange={(e) => editarHorario(h.dia_semana, 'hora_inicio', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primario disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={h.hora_fim}
                          disabled={!h.ativo}
                          onChange={(e) => editarHorario(h.dia_semana, 'hora_fim', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primario disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={!!h.ativo}
                              onChange={(e) => editarHorario(h.dia_semana, 'ativo', e.target.checked ? 1 : 0)}
                            />
                            <div className={`w-9 h-5 rounded-full transition-colors ${h.ativo ? 'bg-principal' : 'bg-gray-300'}`} />
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.ativo ? 'translate-x-4' : ''}`} />
                          </div>
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => salvarHorario(h)}
                          className="text-xs text-principal hover:underline font-medium"
                        >
                          Salvar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'servicos' && (
            <div>
              <div className="flex justify-end mb-3">
                <BotaoPrimario onClick={() => abrirModalServ()}>+ Novo serviço</BotaoPrimario>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {servicos.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Nenhum serviço cadastrado.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">Valor padrão</th>
                        <th className="px-4 py-3 text-left">Duração</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {servicos.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{s.nome}</td>
                          <td className="px-4 py-3 text-gray-500">{formatarMoeda(s.valor_padrao)}</td>
                          <td className="px-4 py-3 text-gray-500">{s.duracao_minutos ? `${s.duracao_minutos} min` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.ativo ? 'bg-principal-claro text-principal' : 'bg-gray-100 text-gray-500'}`}>
                              {s.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => abrirModalServ(s)} className="text-xs text-principal hover:underline">Editar</button>
                              <button onClick={() => toggleAtivoServico(s)} className="text-xs text-gray-400 hover:underline">
                                {s.ativo ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal profissional */}
      {modalProf && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {profEditando ? 'Editar profissional' : 'Novo profissional'}
            </h3>
            <form onSubmit={salvarProf} className="flex flex-col gap-3">
              <CampoTexto rotulo="Nome *" value={formProf.nome} onChange={(e) => setFormProf((f) => ({ ...f, nome: e.target.value }))} required />
              <CampoTexto rotulo="Especialidade" value={formProf.especialidade} onChange={(e) => setFormProf((f) => ({ ...f, especialidade: e.target.value }))} />

              <CampoSelect
                rotulo="Tipo de repasse"
                value={formProf.tipo_repasse}
                onChange={(e) => setFormProf((f) => ({ ...f, tipo_repasse: e.target.value as TipoRepasse }))}
                opcoes={[
                  { valor: 'percentual_por_procedimento', rotulo: '% por procedimento (Anne, Juliana, Raisa)' },
                  { valor: 'percentual_mensal', rotulo: '% mensal — fechamento (Leandro)' },
                  { valor: 'fixo_por_dente', rotulo: 'Fixo por dente (Kevin)' },
                  { valor: 'diaria', rotulo: 'Diária fixa (Erika)' },
                ]}
              />

              {/* Campos por tipo */}
              {(tipo === 'percentual_por_procedimento' || tipo === 'percentual_mensal') && (
                <>
                  <p className="text-xs text-gray-400">
                    Fórmula: (valor − taxa_cartão% − 15% imposto) × % padrão
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <CampoTexto
                      rotulo="% Padrão *"
                      type="number"
                      step="0.1"
                      value={formProf.percentual_padrao}
                      onChange={(e) => setFormProf((f) => ({ ...f, percentual_padrao: e.target.value }))}
                      placeholder="Ex: 40"
                    />
                    <CampoTexto
                      rotulo="% Taxa cartão"
                      type="number"
                      step="0.1"
                      value={formProf.percentual_cartao}
                      onChange={(e) => setFormProf((f) => ({ ...f, percentual_cartao: e.target.value }))}
                      placeholder="Ex: 3"
                    />
                    <CampoTexto
                      rotulo="% Parcelado"
                      type="number"
                      step="0.1"
                      value={formProf.percentual_parcelado}
                      onChange={(e) => setFormProf((f) => ({ ...f, percentual_parcelado: e.target.value }))}
                      placeholder="Ex: 3"
                    />
                  </div>
                  {tipo === 'percentual_mensal' && (
                    <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded p-2">
                      O repasse é calculado no fechamento mensal. Os registros ficam acumulados por competência.
                    </p>
                  )}
                </>
              )}

              {tipo === 'fixo_por_dente' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Tabela por tipo de dente (JSON)</label>
                    <textarea
                      rows={4}
                      value={formProf.regras_especiais}
                      onChange={(e) => setFormProf((f) => ({ ...f, regras_especiais: e.target.value }))}
                      placeholder={'{\n  "incisivo": 200,\n  "canino": 200,\n  "pre_molar": 250,\n  "molar": 300,\n  "retratamento_extra": 100\n}'}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primario resize-none"
                    />
                    <p className="text-xs text-gray-400">O nome do serviço deve conter a chave correspondente (ex: "molar", "canino").</p>
                  </div>
                </>
              )}

              {tipo === 'diaria' && (
                <CampoTexto
                  rotulo="Valor da diária (R$) *"
                  type="number"
                  step="0.01"
                  value={formProf.valor_diaria}
                  onChange={(e) => setFormProf((f) => ({ ...f, valor_diaria: e.target.value }))}
                  placeholder="Ex: 350"
                />
              )}

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Observações</label>
                <textarea rows={2} value={formProf.observacoes} onChange={(e) => setFormProf((f) => ({ ...f, observacoes: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario resize-none" />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <BotaoPrimario type="button" variante="secundario" onClick={() => setModalProf(false)}>Cancelar</BotaoPrimario>
                <BotaoPrimario type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</BotaoPrimario>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal serviço */}
      {modalServ && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {servEditando ? 'Editar serviço' : 'Novo serviço'}
            </h3>
            <form onSubmit={salvarServ} className="flex flex-col gap-3">
              <CampoTexto rotulo="Nome *" value={formServ.nome} onChange={(e) => setFormServ((f) => ({ ...f, nome: e.target.value }))} required />
              <CampoTexto rotulo="Valor padrão (R$)" type="number" step="0.01" value={formServ.valor_padrao} onChange={(e) => setFormServ((f) => ({ ...f, valor_padrao: e.target.value }))} placeholder="0,00" />
              <CampoTexto rotulo="Duração (minutos)" type="number" value={formServ.duracao_minutos} onChange={(e) => setFormServ((f) => ({ ...f, duracao_minutos: e.target.value }))} placeholder="60" />
              <div className="flex gap-3 justify-end pt-1">
                <BotaoPrimario type="button" variante="secundario" onClick={() => setModalServ(false)}>Cancelar</BotaoPrimario>
                <BotaoPrimario type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</BotaoPrimario>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
