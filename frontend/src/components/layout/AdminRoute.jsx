import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export default function AdminRoute() {
  const { user } = useAuthStore()
  if (user?.role !== 'admin') return <Navigate to="/chat" replace />
  return <Outlet />
}
