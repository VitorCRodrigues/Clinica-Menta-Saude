export interface Paciente {
  id: number
  nome: string
  telefone?: string
  email?: string
  data_nascimento?: string
  cpf?: string
  endereco?: string
  profissao?: string
  anamnese?: string
  historico_clinico?: string
  status_retorno: 'ativo' | 'inativo' | 'aguardando' | 'retornou'
  origem?: string
  created_at: string
  atendimentos?: Atendimento[]
}

export type TipoRepasse = 'percentual_por_procedimento' | 'percentual_mensal' | 'fixo_por_dente' | 'diaria'

export interface Profissional {
  id: number
  nome: string
  especialidade?: string
  percentual_padrao?: number
  percentual_cartao?: number
  percentual_parcelado?: number
  observacoes?: string
  ativo: number
  tipo_repasse?: TipoRepasse
  valor_diaria?: number
  regras_especiais?: string
}

export interface Servico {
  id: number
  nome: string
  valor_padrao?: number
  duracao_minutos?: number
  ativo: number
}

export interface Atendimento {
  id: number
  paciente_id: number
  profissional_id?: number
  servico_id?: number
  data_realizacao: string
  horario?: string
  valor_cobrado?: number
  status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'faltou'
  observacoes?: string
  created_at: string
  paciente_nome?: string
  profissional_nome?: string
  servico_nome?: string
  financeiro?: Financeiro[]
}

export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'transferencia'

export interface Financeiro {
  id: number
  atendimento_id: number
  valor_recebido: number
  forma_pagamento?: FormaPagamento
  num_parcelas: number
  forma_pagamento_2?: FormaPagamento
  valor_pagamento_2?: number
  num_parcelas_2?: number
  status_pagamento: 'pendente' | 'pago' | 'cancelado'
  data_pagamento?: string
  observacoes?: string
  created_at: string
  paciente_nome?: string
  profissional_nome?: string
  data_realizacao?: string
}

export interface Repasse {
  id: number
  profissional_id: number
  atendimento_id: number
  financeiro_id: number
  valor_bruto: number
  percentual_aplicado: number
  valor_repasse: number
  forma_pagamento?: string
  status: 'pendente' | 'pago'
  competencia?: string
  created_at: string
  profissional_nome?: string
  paciente_nome?: string
  servico_nome?: string
  data_realizacao?: string
}

export interface DashboardData {
  atendimentos_hoje: number
  recebido_hoje: number
  status_hoje: { status: string; quantidade: number }[]
  aniversariantes: { id: number; nome: string; telefone?: string; data_nascimento: string }[]
  sem_consulta: { id: number; nome: string; telefone?: string; ultima_consulta: string | null }[]
  repasses_pendentes: { profissional_id: number; profissional_nome: string; quantidade: number; total_pendente: number }[]
}

export interface HorarioFuncionamento {
  dia_semana: number
  nome_dia: string
  hora_inicio: string
  hora_fim: string
  ativo: number
}

export interface RelatorioData {
  periodo: { mes: number; ano: number; inicio: string; fim: string }
  pacientes_novos: number
  consultas_realizadas: number
  por_procedimento: { procedimento: string | null; quantidade: number }[]
  retornaram: number
  receita_total: number
  repasses_por_dentista: { profissional: string; quantidade: number; total_bruto: number; total_repasse: number; status: string }[]
  consultas_por_dia: { data: string; quantidade: number }[]
}
