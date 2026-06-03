import { useQuery } from '@tanstack/react-query'
import { Users, FileText, MessageSquare, Building2, UserCheck, Clock, Loader } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Link } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#13151a]
        p-5 transition-all duration-300 hover:border-white/[0.12] hover:shadow-2xl
        hover:shadow-black/40 hover:-translate-y-0.5
        ${to ? 'cursor-pointer' : ''}
      `}
    >
      {/* subtle inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-300">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-100">{value ?? '—'}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )

  return to ? <Link to={to}>{content}</Link> : content
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: pendingUsers } = useQuery({
    queryKey: ['pending-users'],
    queryFn: () => adminApi.pendingUsers().then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex h-full items-center justify-center bg-[#0d0f13]">
      <Loader className="h-6 w-6 animate-spin text-amber-400" />
    </div>
  )

  return (
    <div className="h-full overflow-y-auto bg-[#0d0f13] p-6">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div className="border-b border-white/[0.06] pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">System overview</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.total_users}
            color="bg-blue-500/10 text-blue-400"
            to="/admin/users"
          />
          <StatCard
            icon={UserCheck}
            label="Active Users"
            value={stats?.active_users}
            color="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={Clock}
            label="Pending Approval"
            value={stats?.pending_approval}
            color="bg-amber-500/10 text-amber-400"
            to="/admin/users"
          />
          <StatCard
            icon={Building2}
            label="Departments"
            value={stats?.departments}
            color="bg-violet-500/10 text-violet-400"
            to="/admin/departments"
          />
          <StatCard
            icon={FileText}
            label="Total Documents"
            value={stats?.total_documents}
            color="bg-rose-500/10 text-rose-400"
            to="/admin/documents"
          />
          <StatCard
            icon={FileText}
            label="Processed"
            value={stats?.processed_documents}
            color="bg-teal-500/10 text-teal-400"
          />
          <StatCard
            icon={MessageSquare}
            label="Chat Sessions"
            value={stats?.total_chat_sessions}
            color="bg-indigo-500/10 text-indigo-400"
          />
          <StatCard
            icon={MessageSquare}
            label="Total Messages"
            value={stats?.total_messages}
            color="bg-pink-500/10 text-pink-400"
          />
        </div>

        {/* Pending users */}
        {pendingUsers?.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#13151a] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-300">
                <Clock className="h-4 w-4 text-amber-400" />
                Pending Approvals
                <span className="ml-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400">
                  {pendingUsers.length}
                </span>
              </h2>
              <Link
                to="/admin/users"
                className="text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {pendingUsers.slice(0, 5).map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-4 py-3 transition-colors hover:border-amber-500/20"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-300">{u.full_name}</p>
                    <p className="text-xs text-slate-300">{u.email}</p>
                  </div>
                  <Link
                    to="/admin/users"
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-slate-100"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}