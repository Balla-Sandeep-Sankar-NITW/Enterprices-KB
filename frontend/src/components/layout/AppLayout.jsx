import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[#0d0f13] overflow-hidden antialiased selection:bg-orange-500/30 selection:text-orange-200">
      <Sidebar />
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  )
}