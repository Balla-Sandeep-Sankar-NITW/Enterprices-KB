import { NavLink, useNavigate } from 'react-router-dom'
import {
  MessageSquare, FileText, User, LayoutDashboard,
  Users, Building2, LogOut, BookOpen, FolderOpen
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import clsx from 'clsx'

const navItem = (to, icon, label, shortLabel) => ({ to, icon, label, shortLabel })

const employeeNav = [
  navItem('/chat',      MessageSquare, 'Chat',      'Chat'),
  navItem('/documents', FileText,      'Documents', 'Docs'),
  navItem('/profile',   User,          'Profile',   'Profile'),
]

const adminNav = [
  navItem('/admin',             LayoutDashboard, 'Dashboard',   'Home'),
  navItem('/admin/users',       Users,           'Users',       'Users'),
  navItem('/admin/departments', Building2,       'Departments', 'Depts'),
  navItem('/admin/documents',   FolderOpen,      'Documents',   'Docs'),
  navItem('/chat',              MessageSquare,   'Chat',        'Chat'),
  navItem('/profile',           User,            'Profile',     'Me'),
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const nav = user?.role === 'admin' ? adminNav : employeeNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Total tab count = nav items + 1 logout button
  const totalTabs = nav.length + 1

  return (
    <>
      {/* ── DESKTOP & TABLET SIDEBAR (md+) ── */}
      <aside
        className={clsx(
          'hidden md:flex flex-col h-full shrink-0',
          'md:w-16 lg:w-60',
          'bg-[#13151a] border-r border-white/[0.06] text-slate-200'
        )}
      >
        {/* Logo */}
        <div className="p-3 lg:p-5 border-b border-white/[0.06] relative overflow-hidden shrink-0">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-orange-500/[0.01] to-transparent" />
          <div className="relative hidden lg:flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shadow-inner shrink-0">
              <BookOpen className="w-4 h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-100 leading-none tracking-wide truncate">Enterprise KB</p>
              <p className="text-[10px] text-orange-400 mt-1 uppercase font-semibold tracking-wider truncate">
                {user?.role === 'admin' ? 'Admin Panel' : 'Knowledge Base'}
              </p>
            </div>
          </div>
          <div className="relative flex lg:hidden items-center justify-center">
            <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shadow-inner">
              <BookOpen className="w-4 h-4 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to + label}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 border border-transparent',
                  'md:justify-center lg:justify-start',
                  'px-2 py-2.5 lg:px-3',
                  isActive
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/10 font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-100'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline truncate">{label}</span>
              <span className="sr-only lg:hidden">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 lg:p-3 border-t border-white/[0.06] bg-[#0d0f13]/40 shrink-0">
          <div className="hidden lg:block px-3 py-2 mb-2 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {user?.department?.name || 'No department'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center gap-3 w-full rounded-xl text-sm font-medium',
              'text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10',
              'transition-all duration-150 md:justify-center lg:justify-start',
              'px-2 py-2.5 lg:px-3'
            )}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
       * MOBILE BOTTOM TAB BAR  (<768px)
       *
       * THE FIX — why tabs were bunching left with wasted space on the right:
       *
       * Previous code used `flex-1 max-w-[56px]`. When flex-1 tries to grow
       * but max-w caps it, the tabs reach their max and stop — the leftover
       * space is unoccupied, making it look like tabs are left-aligned.
       *
       * THE CORRECT APPROACH — CSS Grid with equal columns:
       *
       *   grid-cols-{N}   where N = total tabs (nav items + logout)
       *
       * Grid divides the full bar width into exactly N equal columns with
       * zero leftover space. Every tab gets identical width regardless of
       * screen size. No flex quirks, no max-w collisions.
       *
       * We compute totalTabs = nav.length + 1 (logout) above and apply it
       * via an inline style since Tailwind can't generate dynamic grid-cols.
       * ════════════════════════════════════════════════════════════════════ */}
      <nav
        className={clsx(
          'md:hidden',
          'fixed bottom-0 inset-x-0 z-50',
          'bg-[#13151a]',
          'border-t border-white/[0.08]',
          'pb-[env(safe-area-inset-bottom,0px)]',
          // Use grid instead of flex so columns are perfectly equal
          'grid'
        )}
        style={{ gridTemplateColumns: `repeat(${totalTabs}, 1fr)` }}
        aria-label="Mobile navigation"
      >
        {nav.map(({ to, icon: Icon, label, shortLabel }) => (
          <NavLink
            key={to + label}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              clsx(
                // w-full fills the grid cell; no flex-1 or max-w needed
                'w-full flex flex-col items-center justify-center gap-0.5',
                'pt-2 pb-1.5 px-1',
                'text-[9px] font-semibold tracking-wide uppercase',
                'transition-colors duration-150 min-w-0 overflow-hidden',
                isActive ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx(
                  'w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150',
                  isActive ? 'bg-orange-500/15' : ''
                )}>
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className="truncate w-full text-center leading-none">
                  {shortLabel}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Logout tab */}
        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex flex-col items-center justify-center gap-0.5',
            'pt-2 pb-1.5 px-1',
            'text-[9px] font-semibold tracking-wide uppercase',
            'text-rose-500 hover:text-rose-400 transition-colors duration-150 min-w-0 overflow-hidden'
          )}
          aria-label="Logout"
        >
          <span className="w-8 h-8 flex items-center justify-center rounded-xl">
            <LogOut className="w-[18px] h-[18px]" />
          </span>
          <span className="truncate w-full text-center leading-none">Out</span>
        </button>
      </nav>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
 * MobileNavSpacer — place at the BOTTOM of your scrollable <main> content.
 * Prevents the fixed bottom bar from overlapping the last element on a page.
 * ══════════════════════════════════════════════════════════════════════════ */
export function MobileNavSpacer() {
  return (
    <div
      className="md:hidden h-[calc(56px+env(safe-area-inset-bottom,0px))] shrink-0 w-full"
      aria-hidden="true"
    />
  )
}

/* ══════════════════════════════════════════════════════════════════════════
 * AppLayout — correct structural wrapper.
 *
 * Usage in your router:
 *   import { AppLayout } from '@/components/Sidebar'
 *   <AppLayout><Outlet /></AppLayout>
 * ══════════════════════════════════════════════════════════════════════════ */
export function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0f13]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
          <MobileNavSpacer />
        </main>
      </div>
    </div>
  )
}