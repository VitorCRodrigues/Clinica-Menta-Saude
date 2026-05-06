import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { criarAtendimento, listarPacientes, listarProfissionais, listarServicos } from '../../services/api'
import type { Paciente, Profissional, Servico } from '../../types'
import BotaoPrimario from '../../components/BotaoPrimario'
import CampoTexto from '../../components/CampoTexto'
import CampoSelect from '../../components/CampoSelect'

export default function NovoAgendamento() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pacientePreSelecionado = searchParams.get('paciente')

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    paciente_id: pacientePreSelecionado || '',
    profissional_id: '',
    servico_id: '',
    data_realizacao: new Date().toISOString().split('T')[0],
    horario: '',
    valor_cobrado: '',
    status: 'agendado',
    observacoes: '',
  })

  useEffect(() => {
    Promise.all([
      listarPacientes(),
      listarProfissionais(true),
      listarServicos(true),
    ]).then(([p, prof, s]) => {
      setPacientes(p)
      setProfissionais(prof)
      setServicos(s)
    })
  }, [])

  function atualizar(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function aoSelecionarServico(servicoId: string) {
    atualizar('servico_id', servicoId)
    if (servicoId) {
      const servico = servicos.find((s) => s.id === Number(servicoId))
      if (servico?.valor_padrao) {
        atualizar('valor_cobrado', String(servico.valor_padrao))
      }
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.paciente_id || !form.data_realizacao) {
      setErro('Paciente e data são obrigatórios')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await criarAtendimento({
        paciente_id: Number(form.paciente_id),
        profissional_id: form.profissional_id ? Number(form.profissional_id) : undefined,
        servico_id: form.servico_id ? Number(form.servico_id) : undefined,
        data_realizacao: form.data_realizacao,
        horario: form.horario || undefined,
        valor_cobrado: form.valor_cobrado ? Number(form.valor_cobrado) : undefined,
        status: form.status as 'agendado',
        observacoes: form.observacoes || undefined,
      })
      navigate('/agenda')
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/agenda')} className="text-gray-400 hover:text-gray-600">
          ← Voltar
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Novo agendamento</h2>
      </div>

      <form onSubmit={salvar} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
        {erro && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{erro}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <CampoSelect
              rotulo="Paciente *"
              value={form.paciente_id}
              onChange={(e) => atualizar('paciente_id', e.target.value)}
              opcoes={pacientes.map((p) => ({ valor: p.id, rotulo: p.nome }))}
            />
          </div>
          <CampoSelect
            rotulo="Profissional"
            value={form.profissional_id}
            onChange={(e) => atualizar('profissional_id', e.target.value)}
            opcoes={profissionais.map((p) => ({ valor: p.id, rotulo: p.nome }))}
          />
          <CampoSelect
            rotulo="Serviço"
            value={form.servico_id}
            onChange={(e) => aoSelecionarServico(e.target.value)}
            opcoes={servicos.map((s) => ({ valor: s.id, rotulo: s.nome }))}
          />
          <CampoTexto
            rotulo="Data *"
            type="date"
            value={form.data_realizacao}
            onChange={(e) => atualizar('data_realizacao', e.target.value)}
          />
          <CampoTexto
            rotulo="Horário"
            type="time"
            value={form.horario}
            onChange={(e) => atualizar('horario', e.target.value)}
          />
          <CampoTexto
            rotulo="Valor cobrado (R$)"
            type="number"
            step="0.01"
            value={form.valor_cobrado}
            onChange={(e) => atualizar('valor_cobrado', e.target.value)}
            placeholder="0,00"
          />
          <CampoSelect
            rotulo="Status"
            value={form.status}
            onChange={(e) => atualizar('status', e.target.value)}
            opcoes={[
              { valor: 'agendado', rotulo: 'Agendado' },
              { valor: 'confirmado', rotulo: 'Confirmado' },
              { valor: 'realizado', rotulo: 'Realizado' },
              { valor: 'faltou', rotulo: 'Faltou' },
              { valor: 'cancelado', rotulo: 'Cancelado' },
            ]}
          />
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Observações</label>
            <textarea
              rows={3}
              value={form.observacoes}
              onChange={(e) => atualizar('observacoes', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <BotaoPrimario type="button" variante="secundario" onClick={() => navigate('/agenda')}>
            Cancelar
          </BotaoPrimario>
          <BotaoPrimario type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar agendamento'}
          </BotaoPrimario>
        </div>
      </form>
    </div>
  )
}
