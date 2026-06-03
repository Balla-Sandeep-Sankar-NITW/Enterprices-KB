import { NavLink, useNavigate } from 'react-router-dom'
import {
  MessageSquare, FileText, User, LayoutDashboard,
  Users, Building2, LogOut, BookOpen, FolderOpen
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import clsx from 'clsx'

const navItem = (to, icon, label) => ({ to, icon, label })

const employeeNav = [
  navItem('/chat', MessageSquare, 'Chat'),
  navItem('/documents', FileText, 'Documents'),
  navItem('/profile', User, 'Profile'),
]

const adminNav = [
  navItem('/admin', LayoutDashboard, 'Dashboard'),
  navItem('/admin/users', Users, 'Users'),
  navItem('/admin/departments', Building2, 'Departments'),
  navItem('/admin/documents', FolderOpen, 'Documents'),
  navItem('/chat', MessageSquare, 'Chat'),
  navItem('/profile', User, 'Profile'),
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const nav = user?.role === 'admin' ? adminNav : employeeNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-[#13151a] border-r border-white/[0.06] flex flex-col h-full shrink-0 text-slate-200">
      {/* Logo Container */}
      <div className="p-5 border-b border-white/[0.06] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-orange-500/[0.01] to-transparent" />
        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shadow-inner">
            <BookOpen className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none tracking-wide">Enterprise KB</p>
            <p className="text-[10px] text-orange-400 mt-1 uppercase font-semibold tracking-wider">
              {user?.role === 'admin' ? 'Admin Panel' : 'Knowledge Base'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation links */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to + label}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border border-transparent',
                isActive
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/10 font-semibold shadow-sm'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-100'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User contextual footer info */}
      <div className="p-3 border-t border-white/[0.06] bg-[#0d0f13]/40">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-semibold text-slate-200 truncate">{user?.full_name}</p>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{user?.department?.name || 'No department'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}