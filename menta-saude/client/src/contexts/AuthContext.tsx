import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Usuario {
  id: number
  nome: string
  email: string
  perfil: 'admin' | 'secretaria'
}

interface AuthContextType {
  usuario: Usuario | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('menta_token')
    if (!token) {
      setCarregando(false)
      return
    }
    const BASE = import.meta.env.VITE_API_URL || ''
    fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => setUsuario(u))
      .catch(() => localStorage.removeItem('menta_token'))
      .finally(() => setCarregando(false))
  }, [])

  async function login(email: string, senha: string) {
    const BASE = import.meta.env.VITE_API_URL || ''
    const resposta = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })
    const dados = await resposta.json()
    if (!resposta.ok) throw new Error(dados.erro || 'Credenciais inválidas')
    localStorage.setItem('menta_token', dados.token)
    setUsuario(dados.usuario)
    navigate('/dashboard')
  }

  function logout() {
    localStorage.removeItem('menta_token')
    setUsuario(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
