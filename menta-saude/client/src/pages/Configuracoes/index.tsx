import { useEffect, useState } from 'react'
import {
  listarProfissionais, criarProfissional, atualizarProfissional,
  listarServicos, criarServico, atualizarServico,
} from '../../services/api'
import type { Profissional, Servico } from '../../types'
import BotaoPrimario from '../../components/BotaoPrimario'
import CampoTexto from '../../components/CampoTexto'
import Carregando from '../../components/Carregando'

type Aba = 'profissionais' | 'servicos'

function formatarMoeda(valor?: number) {
  if (!valor) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

export default function Configuracoes() {
  const [aba, setAba] = useState<Aba>('profissionais')
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalProf, setModalProf] = useState(false)
  const [modalServ, setModalServ] = useState(false)
  const [profEditando, setProfEditando] = useState<Profissional | null>(null)
  const [servEditando, setServEditando] = useState<Servico | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [formProf, setFormProf] = useState({ nome: '', especialidade: '', percentual_padrao: '', percentual_cartao: '', percentual_parcelado: '', observacoes: '' })
  const [formServ, setFormServ] = useState({ nome: '', valor_padrao: '', duracao_minutos: '' })

  function carregarDados() {
    setCarregando(true)
    Promise.all([listarProfissionais(), listarServicos()])
      .then(([p, s]) => { setProfissionais(p); setServicos(s) })
      .finally(() => setCarregando(false))
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
    } : { nome: '', especialidade: '', percentual_padrao: '', percentual_cartao: '', percentual_parcelado: '', observacoes: '' })
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
      const dados = {
        nome: formProf.nome,
        especialidade: formProf.especialidade || undefined,
        percentual_padrao: formProf.percentual_padrao ? Number(formProf.percentual_padrao) : undefined,
        percentual_cartao: formProf.percentual_cartao ? Number(formProf.percentual_cartao) : undefined,
        percentual_parcelado: formProf.percentual_parcelado ? Number(formProf.percentual_parcelado) : undefined,
        observacoes: formProf.observacoes || undefined,
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

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h2>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(['profissionais', 'servicos'] as Aba[]).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              aba === a ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {a === 'profissionais' ? 'Dentistas / Profissionais' : 'Serviços'}
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
                        <th className="px-4 py-3 text-left">% Padrão</th>
                        <th className="px-4 py-3 text-left">% Cartão</th>
                        <th className="px-4 py-3 text-left">% Parcelado</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {profissionais.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{p.nome}</td>
                          <td className="px-4 py-3 text-gray-500">{p.especialidade || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{p.percentual_padrao ? `${p.percentual_padrao}%` : '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{p.percentual_cartao ? `${p.percentual_cartao}%` : '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{p.percentual_parcelado ? `${p.percentual_parcelado}%` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {profEditando ? 'Editar profissional' : 'Novo profissional'}
            </h3>
            <form onSubmit={salvarProf} className="flex flex-col gap-3">
              <CampoTexto rotulo="Nome *" value={formProf.nome} onChange={(e) => setFormProf((f) => ({ ...f, nome: e.target.value }))} required />
              <CampoTexto rotulo="Especialidade" value={formProf.especialidade} onChange={(e) => setFormProf((f) => ({ ...f, especialidade: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <CampoTexto rotulo="% Padrão" type="number" step="0.1" value={formProf.percentual_padrao} onChange={(e) => setFormProf((f) => ({ ...f, percentual_padrao: e.target.value }))} placeholder="Ex: 50" />
                <CampoTexto rotulo="% Cartão" type="number" step="0.1" value={formProf.percentual_cartao} onChange={(e) => setFormProf((f) => ({ ...f, percentual_cartao: e.target.value }))} placeholder="Ex: 45" />
                <CampoTexto rotulo="% Parcelado" type="number" step="0.1" value={formProf.percentual_parcelado} onChange={(e) => setFormProf((f) => ({ ...f, percentual_parcelado: e.target.value }))} placeholder="Ex: 40" />
              </div>
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
