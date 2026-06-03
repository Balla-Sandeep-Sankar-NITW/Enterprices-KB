import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export default function PrivateRoute() {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />
  if (user.status === 'pending_email') return <Navigate to="/verify-email" replace />
  if (user.status === 'pending_approval') return <Navigate to="/pending-approval" replace />
  if (user.status !== 'active') return <Navigate to="/login" replace />

  return <Outlet />
}
