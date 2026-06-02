import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import RotaProtegida from './components/RotaProtegida'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import NovoPaciente from './pages/Pacientes/NovoPaciente'
import FichaPaciente from './pages/Pacientes/FichaPaciente'
import Agenda from './pages/Agenda'
import NovoAgendamento from './pages/Agenda/NovoAgendamento'
import Financeiro from './pages/Financeiro'
import Configuracoes from './pages/Configuracoes'
import Relatorios from './pages/Relatorios'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RotaProtegida />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="pacientes/novo" element={<NovoPaciente />} />
              <Route path="pacientes/:id" element={<FichaPaciente />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="agenda/novo" element={<NovoAgendamento />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
