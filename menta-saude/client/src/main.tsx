import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import NovoPaciente from './pages/Pacientes/NovoPaciente'
import FichaPaciente from './pages/Pacientes/FichaPaciente'
import Agenda from './pages/Agenda'
import NovoAgendamento from './pages/Agenda/NovoAgendamento'
import Financeiro from './pages/Financeiro'
import Configuracoes from './pages/Configuracoes'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/novo" element={<NovoPaciente />} />
          <Route path="pacientes/:id" element={<FichaPaciente />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="agenda/novo" element={<NovoAgendamento />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
