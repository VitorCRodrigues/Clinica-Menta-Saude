export interface Paciente {
  id: number
  nome: string
  telefone?: string
  email?: string
  data_nascimento?: string
  anamnese?: string
  historico_clinico?: string
  status_retorno: 'ativo' | 'inativo' | 'aguardando'
  origem?: string
  created_at: string
  atendimentos?: Atendimento[]
}

export interface Profissional {
  id: number
  nome: string
  especialidade?: string
  percentual_padrao?: number
  percentual_cartao?: number
  percentual_parcelado?: number
  observacoes?: string
  ativo: number
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

export interface Financeiro {
  id: number
  atendimento_id: number
  valor_recebido: number
  forma_pagamento?: 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'transferencia'
  num_parcelas: number
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
