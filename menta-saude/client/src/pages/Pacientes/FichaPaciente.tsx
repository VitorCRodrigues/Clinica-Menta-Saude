import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { buscarPaciente, atualizarPaciente } from '../../services/api'
import type { Paciente } from '../../types'
import Carregando from '../../components/Carregando'
import BotaoPrimario from '../../components/BotaoPrimario'
import CampoTexto from '../../components/CampoTexto'
import CampoSelect from '../../components/CampoSelect'

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarMoeda(valor?: number) {
  if (valor === undefined || valor === null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

const corStatus: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-green-100 text-green-700',
  realizado: 'bg-principal-claro text-principal',
  cancelado: 'bg-red-100 text-red-700',
  faltou: 'bg-yellow-100 text-yellow-700',
}

export default function FichaPaciente() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState<Partial<Paciente>>({})

  useEffect(() => {
    buscarPaciente(Number(id))
      .then((p) => { setPaciente(p); setForm(p) })
      .finally(() => setCarregando(false))
  }, [id])

  async function salvar() {
    setSalvando(true)
    try {
      const atualizado = await atualizarPaciente(Number(id), form)
      setPaciente({ ...atualizado, atendimentos: paciente?.atendimentos })
      setEditando(false)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <Carregando />
  if (!paciente) return <div className="p-8 text-red-600">Paciente não encontrado.</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/pacientes')} className="text-gray-400 hover:text-gray-600">
          ← Voltar
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{paciente.nome}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados do paciente */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Dados pessoais</h3>
            {!editando ? (
              <BotaoPrimario tamanho="sm" variante="secundario" onClick={() => setEditando(true)}>
                Editar
              </BotaoPrimario>
            ) : (
              <div className="flex gap-2">
                <BotaoPrimario tamanho="sm" variante="secundario" onClick={() => { setEditando(false); setForm(paciente) }}>
                  Cancelar
                </BotaoPrimario>
                <BotaoPrimario tamanho="sm" onClick={salvar} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </BotaoPrimario>
              </div>
            )}
          </div>

          {editando ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <CampoTexto
                  rotulo="Nome"
                  value={form.nome || ''}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <CampoTexto
                rotulo="Telefone"
                value={form.telefone || ''}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              />
              <CampoTexto
                rotulo="E-mail"
                value={form.email || ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <CampoTexto
                rotulo="Data de nascimento"
                type="date"
                value={form.data_nascimento || ''}
                onChange={(e) => setForm((f) => ({ ...f, data_nascimento: e.target.value }))}
              />
              <CampoTexto
                rotulo="Origem"
                value={form.origem || ''}
                onChange={(e) => setForm((f) => ({ ...f, origem: e.target.value }))}
              />
              <CampoSelect
                rotulo="Status"
                value={form.status_retorno || 'ativo'}
                onChange={(e) => setForm((f) => ({ ...f, status_retorno: e.target.value as Paciente['status_retorno'] }))}
                opcoes={[
                  { valor: 'ativo', rotulo: 'Ativo' },
                  { valor: 'inativo', rotulo: 'Inativo' },
                  { valor: 'aguardando', rotulo: 'Aguardando' },
                ]}
              />
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Anamnese</label>
                <textarea
                  rows={3}
                  value={form.anamnese || ''}
                  onChange={(e) => setForm((f) => ({ ...f, anamnese: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario resize-none"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Histórico clínico</label>
                <textarea
                  rows={3}
                  value={form.historico_clinico || ''}
                  onChange={(e) => setForm((f) => ({ ...f, historico_clinico: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario resize-none"
                />
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                { r: 'Telefone', v: paciente.telefone },
                { r: 'E-mail', v: paciente.email },
                { r: 'Nascimento', v: paciente.data_nascimento ? formatarData(paciente.data_nascimento) : undefined },
                { r: 'Origem', v: paciente.origem },
                { r: 'Status', v: paciente.status_retorno },
              ].map(({ r, v }) => (
                <div key={r}>
                  <dt className="text-gray-400 text-xs uppercase">{r}</dt>
                  <dd className="text-gray-700 font-medium">{v || '—'}</dd>
                </div>
              ))}
              {paciente.anamnese && (
                <div className="md:col-span-2">
                  <dt className="text-gray-400 text-xs uppercase mb-1">Anamnese</dt>
                  <dd className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3">{paciente.anamnese}</dd>
                </div>
              )}
              {paciente.historico_clinico && (
                <div className="md:col-span-2">
                  <dt className="text-gray-400 text-xs uppercase mb-1">Histórico clínico</dt>
                  <dd className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3">{paciente.historico_clinico}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Ações</h3>
            <BotaoPrimario
              className="w-full justify-center"
              onClick={() => navigate(`/agenda/novo?paciente=${paciente.id}`)}
            >
              + Agendar consulta
            </BotaoPrimario>
          </div>
        </div>
      </div>

      {/* Histórico de atendimentos */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Histórico de atendimentos</h3>
        {!paciente.atendimentos || paciente.atendimentos.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum atendimento registrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
              <tr>
                <th className="text-left py-2 pr-4">Data</th>
                <th className="text-left py-2 pr-4">Horário</th>
                <th className="text-left py-2 pr-4">Profissional</th>
                <th className="text-left py-2 pr-4">Serviço</th>
                <th className="text-left py-2 pr-4">Valor</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paciente.atendimentos.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 pr-4">{formatarData(a.data_realizacao)}</td>
                  <td className="py-2.5 pr-4 text-gray-500">{a.horario || '—'}</td>
                  <td className="py-2.5 pr-4 text-gray-500">{a.profissional_nome || '—'}</td>
                  <td className="py-2.5 pr-4 text-gray-500">{a.servico_nome || '—'}</td>
                  <td className="py-2.5 pr-4">{formatarMoeda(a.valor_cobrado)}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${corStatus[a.status] || 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
