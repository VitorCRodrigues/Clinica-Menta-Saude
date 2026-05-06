import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { criarPaciente } from '../../services/api'
import BotaoPrimario from '../../components/BotaoPrimario'
import CampoTexto from '../../components/CampoTexto'
import CampoSelect from '../../components/CampoSelect'

export default function NovoPaciente() {
  const navigate = useNavigate()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    anamnese: '',
    historico_clinico: '',
    status_retorno: 'ativo',
    origem: '',
  })

  function atualizar(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return }
    setSalvando(true)
    setErro('')
    try {
      const novo = await criarPaciente({ ...form, status_retorno: form.status_retorno as 'ativo' | 'inativo' | 'aguardando' })
      navigate(`/pacientes/${novo.id}`)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/pacientes')} className="text-gray-400 hover:text-gray-600">
          ← Voltar
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Novo paciente</h2>
      </div>

      <form onSubmit={salvar} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
        {erro && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{erro}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <CampoTexto
              rotulo="Nome completo *"
              value={form.nome}
              onChange={(e) => atualizar('nome', e.target.value)}
              placeholder="Nome do paciente"
            />
          </div>
          <CampoTexto
            rotulo="Telefone"
            value={form.telefone}
            onChange={(e) => atualizar('telefone', e.target.value)}
            placeholder="(00) 00000-0000"
          />
          <CampoTexto
            rotulo="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => atualizar('email', e.target.value)}
            placeholder="email@exemplo.com"
          />
          <CampoTexto
            rotulo="Data de nascimento"
            type="date"
            value={form.data_nascimento}
            onChange={(e) => atualizar('data_nascimento', e.target.value)}
          />
          <CampoTexto
            rotulo="Origem"
            value={form.origem}
            onChange={(e) => atualizar('origem', e.target.value)}
            placeholder="Indicação, Instagram, etc."
          />
          <CampoSelect
            rotulo="Status"
            value={form.status_retorno}
            onChange={(e) => atualizar('status_retorno', e.target.value)}
            opcoes={[
              { valor: 'ativo', rotulo: 'Ativo' },
              { valor: 'inativo', rotulo: 'Inativo' },
              { valor: 'aguardando', rotulo: 'Aguardando' },
            ]}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Anamnese</label>
          <textarea
            rows={3}
            value={form.anamnese}
            onChange={(e) => atualizar('anamnese', e.target.value)}
            placeholder="Histórico de saúde, alergias, medicamentos..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Histórico clínico</label>
          <textarea
            rows={3}
            value={form.historico_clinico}
            onChange={(e) => atualizar('historico_clinico', e.target.value)}
            placeholder="Observações clínicas gerais..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <BotaoPrimario type="button" variante="secundario" onClick={() => navigate('/pacientes')}>
            Cancelar
          </BotaoPrimario>
          <BotaoPrimario type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar paciente'}
          </BotaoPrimario>
        </div>
      </form>
    </div>
  )
}
