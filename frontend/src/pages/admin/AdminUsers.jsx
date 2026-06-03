import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle, XCircle, Trash2, Filter, Loader, UserCheck } from 'lucide-react'
import { adminApi } from '@/api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

// Vibrant low-opacity status indicator configurations
const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  pending_approval: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  pending_email: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  rejected: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  suspended: 'bg-amber-600/10 text-amber-500 border border-amber-600/20',
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [approveModal, setApproveModal] = useState(null)
  const [selectedDept, setSelectedDept] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, statusFilter, page],
    queryFn: () => adminApi.users({ search, status: statusFilter, page, per_page: 20 }).then(r => r.data),
  })

  const { data: departments } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => adminApi.departments().then(r => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: ({ userId, deptId }) => adminApi.approveUser(userId, { department_id: deptId }),
    onSuccess: () => {
      toast.success('User approved!')
      qc.invalidateQueries(['admin-users'])
      qc.invalidateQueries(['admin-dashboard'])
      setApproveModal(null)
      setSelectedDept('')
    },
    onError: err => toast.error(err.response?.data?.detail || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (userId) => adminApi.rejectUser(userId, { reason: 'Not approved by admin' }),
    onSuccess: () => {
      toast.success('User rejected')
      qc.invalidateQueries(['admin-users'])
      qc.invalidateQueries(['admin-dashboard'])
    },
    onError: () => toast.error('Failed to reject'),
  })

  const deleteMutation = useMutation({
    mutationFn: (userId) => adminApi.deleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted')
      qc.invalidateQueries(['admin-users'])
    },
    onError: () => toast.error('Failed to delete'),
  })

  return (
    <div className="h-full flex flex-col bg-[#0d0f13]">
      {/* Header Panel */}
      <div className="bg-[#13151a] border-b border-white/[0.06] px-6 py-5 relative overflow-hidden">
        {/* Subtle dynamic background ambient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] via-transparent to-transparent" />
        
        <div className="relative">
          {/* Main Title - Ice White */}
          <h1 className="text-2xl font-bold tracking-tight text-[#f1f5f9]">User Management</h1>
          {/* Subheading - Light Cool Slate Gray */}
          <p className="text-sm text-[#94a3b8] mt-1">Approve, manage, and monitor system users</p>
        </div>

        <div className="relative flex gap-3 mt-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }} 
            className="rounded-xl border border-white/[0.06] bg-[#0d0f13] px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all w-48"
          >
            <option value="" className="bg-[#13151a]">All statuses</option>
            <option value="active" className="bg-[#13151a]">Active</option>
            <option value="pending_approval" className="bg-[#13151a]">Pending Approval</option>
            <option value="pending_email" className="bg-[#13151a]">Pending Email</option>
            <option value="rejected" className="bg-[#13151a]">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Table Content Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center h-32 items-center">
            <Loader className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#13151a] shadow-2xl shadow-black/40">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent" />
            
            <table className="w-full text-sm relative">
              {/* Table Headers - High contrast layout with orange highlights */}
              <thead className="bg-[#181a21] border-b border-white/[0.06]">
                <tr>
                  {['Name', 'Email', 'Department', 'Status', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-orange-400/80">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data?.users?.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-all group">
                    {/* Primary Name Data Column - Crisper Highlight Text */}
                    <td className="px-5 py-4 font-semibold text-slate-300 group-hover:text-white transition-colors">{u.full_name}</td>
                    {/* Secondary Data Columns - Softened Slate Tint */}
                    <td className="px-5 py-4 text-slate-300 font-medium">{u.email}</td>
                    <td className="px-5 py-4 text-slate-300 font-medium">{u.department?.name || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={clsx('inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize shadow-sm tracking-wide', statusColors[u.status] || 'bg-white/[0.04] text-slate-300')}>
                        {u.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx(
                        'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold border shadow-sm tracking-wide capitalize',
                        u.role === 'admin' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-medium">{format(new Date(u.created_at), 'MMM d, yy')}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {u.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => setApproveModal(u)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all transform hover:scale-105"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(u.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all transform hover:scale-105"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { if (confirm('Delete this user?')) deleteMutation.mutate(u.id) }}
                          className="p-1.5 rounded-lg text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all transform hover:scale-105"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!data?.users?.length && (
              <div className="text-center py-16 text-slate-500 relative font-medium">No system records found</div>
            )}
          </div>
        )}

        {/* Navigation Pagination Controls */}
        {data?.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button 
              onClick={() => setPage(p => p - 1)} 
              disabled={page === 1} 
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:pointer-events-none"
            >
              Prev
            </button>
            <span className="text-sm text-slate-300 font-medium py-2 px-3">Page <span className="text-orange-400">{page}</span> of {data.pages}</span>
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={page === data.pages} 
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Approval Input Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#13151a] p-6 max-w-sm w-full shadow-2xl shadow-black/90">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/[0.04] to-transparent" />
            
            <h3 className="relative font-bold text-[#f1f5f9] text-xl tracking-tight mb-2">Approve System Access</h3>
            <p className="relative text-sm text-slate-300 mb-5 leading-relaxed">
              Configuring properties for <strong className="text-white font-bold">{approveModal.full_name}</strong>. Assign their primary department node:
            </p>
            
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">Primary Location Node</label>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-orange-500/40 transition-colors mb-5"
              >
                <option value="" className="bg-[#13151a]">Select department</option>
                {departments?.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#13151a]">{d.name}</option>
                ))}
              </select>
            </div>

            <div className="relative flex gap-3">
              <button
                onClick={() => approveMutation.mutate({ userId: approveModal.id, deptId: parseInt(selectedDept) })}
                disabled={!selectedDept || approveMutation.isPending}
                className="flex-1 flex items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 px-4 py-2.5 text-sm font-semibold transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              >
                {approveMutation.isPending ? 'Processing...' : 'Grant Access'}
              </button>
              <button 
                onClick={() => setApproveModal(null)} 
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}