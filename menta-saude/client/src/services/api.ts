import type { Paciente, Profissional, Servico, Atendimento, Financeiro, Repasse, DashboardData } from '../types'

const BASE = '/api'

async function requisitar<T>(url: string, opcoes?: RequestInit): Promise<T> {
  const resposta = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  })
  const dados = await resposta.json()
  if (!resposta.ok) throw new Error(dados.erro || 'Erro na requisição')
  return dados
}

// Dashboard
export const buscarDashboard = () =>
  requisitar<DashboardData>('/dashboard')

// Pacientes
export const listarPacientes = (params?: { busca?: string; status?: string }) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  return requisitar<Paciente[]>(`/pacientes${qs ? `?${qs}` : ''}`)
}

export const buscarPaciente = (id: number) =>
  requisitar<Paciente>(`/pacientes/${id}`)

export const criarPaciente = (dados: Partial<Paciente>) =>
  requisitar<Paciente>('/pacientes', { method: 'POST', body: JSON.stringify(dados) })

export const atualizarPaciente = (id: number, dados: Partial<Paciente>) =>
  requisitar<Paciente>(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(dados) })

// Profissionais
export const listarProfissionais = (ativo?: boolean) => {
  const qs = ativo !== undefined ? `?ativo=${ativo}` : ''
  return requisitar<Profissional[]>(`/profissionais${qs}`)
}

export const criarProfissional = (dados: Partial<Profissional>) =>
  requisitar<Profissional>('/profissionais', { method: 'POST', body: JSON.stringify(dados) })

export const atualizarProfissional = (id: number, dados: Partial<Profissional>) =>
  requisitar<Profissional>(`/profissionais/${id}`, { method: 'PUT', body: JSON.stringify(dados) })

// Serviços
export const listarServicos = (ativo?: boolean) => {
  const qs = ativo !== undefined ? `?ativo=${ativo}` : ''
  return requisitar<Servico[]>(`/servicos${qs}`)
}

export const criarServico = (dados: Partial<Servico>) =>
  requisitar<Servico>('/servicos', { method: 'POST', body: JSON.stringify(dados) })

export const atualizarServico = (id: number, dados: Partial<Servico>) =>
  requisitar<Servico>(`/servicos/${id}`, { method: 'PUT', body: JSON.stringify(dados) })

// Atendimentos
export const listarAtendimentos = (params?: { data?: string; profissional_id?: number; paciente_id?: number; status?: string }) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  return requisitar<Atendimento[]>(`/atendimentos${qs ? `?${qs}` : ''}`)
}

export const buscarAtendimento = (id: number) =>
  requisitar<Atendimento>(`/atendimentos/${id}`)

export const criarAtendimento = (dados: Partial<Atendimento>) =>
  requisitar<Atendimento>('/atendimentos', { method: 'POST', body: JSON.stringify(dados) })

export const atualizarAtendimento = (id: number, dados: Partial<Atendimento>) =>
  requisitar<Atendimento>(`/atendimentos/${id}`, { method: 'PUT', body: JSON.stringify(dados) })

// Financeiro
export const listarFinanceiro = (params?: { status_pagamento?: string; forma_pagamento?: string; atendimento_id?: number }) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  return requisitar<Financeiro[]>(`/financeiro${qs ? `?${qs}` : ''}`)
}

export const criarFinanceiro = (dados: Partial<Financeiro>) =>
  requisitar<Financeiro>('/financeiro', { method: 'POST', body: JSON.stringify(dados) })

export const atualizarFinanceiro = (id: number, dados: Partial<Financeiro>) =>
  requisitar<Financeiro>(`/financeiro/${id}`, { method: 'PUT', body: JSON.stringify(dados) })

// Repasses
export const listarRepasses = (params?: { status?: string; competencia?: string }) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  return requisitar<Repasse[]>(`/repasses${qs ? `?${qs}` : ''}`)
}

export const listarRepassesProfissional = (id: number, params?: { status?: string; competencia?: string }) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  return requisitar<{ repasses: Repasse[]; totais: { total_repasse: number; total_bruto: number; quantidade: number } }>(
    `/repasses/profissional/${id}${qs ? `?${qs}` : ''}`
  )
}

export const atualizarRepasse = (id: number, dados: Partial<Repasse>) =>
  requisitar<Repasse>(`/repasses/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
