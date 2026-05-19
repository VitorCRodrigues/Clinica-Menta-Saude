import { NavLink } from 'react-router-dom'

const itens = [
  { caminho: '/dashboard', rotulo: 'Dashboard', icone: '▦' },
  { caminho: '/agenda', rotulo: 'Agenda', icone: '📅' },
  { caminho: '/pacientes', rotulo: 'Pacientes', icone: '👤' },
  { caminho: '/financeiro', rotulo: 'Financeiro', icone: '💰' },
  { caminho: '/configuracoes', rotulo: 'Configurações', icone: '⚙' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-principal flex flex-col">
      <div className="px-6 py-5 border-b border-principal-escuro">
        <div className="flex items-center gap-3">
          <svg width="28" height="32" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 4 C2 4 0 10 0 18 C0 28 4 36 8 36 C10 36 11 32 12 26 C13 32 14 36 16 36 C20 36 24 28 24 18 C24 10 22 4 16 4 C14 4 13 5 12 7 C11 5 10 4 8 4Z" fill="white"/>
          </svg>
          <div>
            <p className="text-white text-[9px] font-medium tracking-widest uppercase leading-none mb-1">CLÍNICA DENTÁRIA</p>
            <p className="text-white text-2xl font-light tracking-wide leading-none">menta</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4">
        {itens.map((item) => (
          <NavLink
            key={item.caminho}
            to={item.caminho}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primario text-white border-l-4 border-white'
                  : 'text-white/80 hover:bg-principal-escuro hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icone}</span>
            {item.rotulo}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-principal-escuro">
        <p className="text-white/50 text-xs">v1.0.0</p>
      </div>
    </aside>
  )
}
