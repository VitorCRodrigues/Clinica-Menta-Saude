import { useState, FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(email, senha)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Credenciais inválidas')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-principal flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-8">
          <svg width="40" height="46" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
            <path d="M8 4 C2 4 0 10 0 18 C0 28 4 36 8 36 C10 36 11 32 12 26 C13 32 14 36 16 36 C20 36 24 28 24 18 C24 10 22 4 16 4 C14 4 13 5 12 7 C11 5 10 4 8 4Z" fill="#008F84"/>
          </svg>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 leading-none mb-1">CLÍNICA DENTÁRIA</p>
          <p className="text-3xl font-light tracking-wide text-principal leading-none">menta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-principal hover:bg-primario text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
