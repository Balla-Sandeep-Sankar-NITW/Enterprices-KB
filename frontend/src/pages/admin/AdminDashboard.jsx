import { useQuery } from '@tanstack/react-query'
import { Users, FileText, MessageSquare, Building2, UserCheck, Clock, Loader } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Link } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className={`card p-5 hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
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
    <div className="flex items-center justify-center h-full">
      <Loader className="w-6 h-6 text-primary-600 animate-spin" />
    </div>
  )

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">System overview</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats?.total_users} color="bg-blue-50 text-blue-600" to="/admin/users" />
          <StatCard icon={UserCheck} label="Active Users" value={stats?.active_users} color="bg-green-50 text-green-600" />
          <StatCard icon={Clock} label="Pending Approval" value={stats?.pending_approval} color="bg-yellow-50 text-yellow-600" to="/admin/users" />
          <StatCard icon={Building2} label="Departments" value={stats?.departments} color="bg-purple-50 text-purple-600" to="/admin/departments" />
          <StatCard icon={FileText} label="Total Documents" value={stats?.total_documents} color="bg-red-50 text-red-600" to="/admin/documents" />
          <StatCard icon={FileText} label="Processed" value={stats?.processed_documents} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={MessageSquare} label="Chat Sessions" value={stats?.total_chat_sessions} color="bg-indigo-50 text-indigo-600" />
          <StatCard icon={MessageSquare} label="Total Messages" value={stats?.total_messages} color="bg-pink-50 text-pink-600" />
        </div>

        {/* Pending users */}
        {pendingUsers?.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Pending Approvals ({pendingUsers.length})
              </h2>
              <Link to="/admin/users" className="text-sm text-primary-600 hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {pendingUsers.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <Link to="/admin/users" className="btn-secondary text-xs px-3 py-1">Review</Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
