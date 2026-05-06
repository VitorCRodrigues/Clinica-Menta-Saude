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
        <h1 className="text-white text-xl font-bold tracking-wide">Menta Saúde</h1>
        <p className="text-green-200 text-xs mt-0.5">Clínica Odontológica</p>
      </div>

      <nav className="flex-1 py-4">
        {itens.map((item) => (
          <NavLink
            key={item.caminho}
            to={item.caminho}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-principal-escuro text-white border-r-4 border-primario'
                  : 'text-green-100 hover:bg-principal-escuro hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icone}</span>
            {item.rotulo}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-principal-escuro">
        <p className="text-green-300 text-xs">v1.0.0</p>
      </div>
    </aside>
  )
}
