import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Carregando from './Carregando'

export default function RotaProtegida() {
  const { usuario, carregando } = useAuth()

  if (carregando) return <Carregando />

  if (!usuario) return <Navigate to="/login" replace />

  return <Outlet />
}
