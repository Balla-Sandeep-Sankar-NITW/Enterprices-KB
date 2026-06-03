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
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">Enterprise KB</p>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">
              {user?.role === 'admin' ? 'Admin Panel' : 'Knowledge Base'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to + label}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.department?.name || 'No department'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
