import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle, XCircle, Trash2, Filter, Loader, UserCheck } from 'lucide-react'
import { adminApi } from '@/api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

const statusColors = {
  active: 'bg-green-50 text-green-700',
  pending_approval: 'bg-yellow-50 text-yellow-700',
  pending_email: 'bg-gray-50 text-gray-600',
  rejected: 'bg-red-50 text-red-700',
  suspended: 'bg-orange-50 text-orange-700',
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [approveModal, setApproveModal] = useState(null) // user object
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Approve, manage, and monitor users</p>

        <div className="flex gap-3 mt-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input pl-9"
            />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="input w-48">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="pending_email">Pending Email</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center h-32 items-center">
            <Loader className="w-5 h-5 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Department', 'Status', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.users?.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.department?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', statusColors[u.status] || 'bg-gray-50 text-gray-600')}>
                        {u.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700')}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{format(new Date(u.created_at), 'MMM d, yy')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => setApproveModal(u)}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(u.id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { if (confirm('Delete this user?')) deleteMutation.mutate(u.id) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
              <div className="text-center py-12 text-gray-400">No users found</div>
            )}
          </div>
        )}

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary text-sm px-3 py-1.5">Prev</button>
            <span className="text-sm text-gray-600 py-1.5">Page {page} of {data.pages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === data.pages} className="btn-secondary text-sm px-3 py-1.5">Next</button>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-1">Approve User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Approving <strong>{approveModal.full_name}</strong>. Select their department:
            </p>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="input mb-4"
            >
              <option value="">Select department</option>
              {departments?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => approveMutation.mutate({ userId: approveModal.id, deptId: parseInt(selectedDept) })}
                disabled={!selectedDept || approveMutation.isPending}
                className="btn-primary flex-1"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
              <button onClick={() => setApproveModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
