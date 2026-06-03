import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Building2, Mail, Shield, Clock, CheckCircle, Send } from 'lucide-react'
import { usersApi } from '@/api/client'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [deptId, setDeptId] = useState('')
  const [reason, setReason] = useState('')
  const qc = useQueryClient()

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => usersApi.departments().then(r => r.data),
  })

  const { data: myRequests } = useQuery({
    queryKey: ['my-dept-requests'],
    queryFn: () => usersApi.myDeptRequests().then(r => r.data),
  })

  const updateProfile = useMutation({
    mutationFn: () => usersApi.updateProfile({ full_name: fullName }),
    onSuccess: () => { toast.success('Profile updated'); loadUser() },
    onError: () => toast.error('Update failed'),
  })

  const submitDeptChange = useMutation({
    mutationFn: () => usersApi.requestDeptChange({
      requested_department_id: parseInt(deptId),
      reason
    }),
    onSuccess: () => {
      toast.success('Department change request submitted')
      setDeptId(''); setReason('')
      qc.invalidateQueries(['my-dept-requests'])
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Request failed'),
  })

  const statusBadge = {
    pending: 'badge bg-yellow-50 text-yellow-700',
    approved: 'badge bg-green-50 text-green-700',
    rejected: 'badge bg-red-50 text-red-700',
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
        </div>

        {/* User info card */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{user?.full_name}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx('badge', user?.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700')}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role}
                </span>
                <span className="badge bg-green-50 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {user?.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span>{user?.department?.name || 'No department'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>Joined {user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : '—'}</span>
            </div>
          </div>
        </div>

        {/* Edit name */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input"
              />
            </div>
            <button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending || !fullName.trim()}
              className="btn-primary"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Department change request */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Request Department Change</h3>
          <p className="text-sm text-gray-500 mb-4">Submit a request to move to a different department. An admin will review it.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requested Department</label>
              <select value={deptId} onChange={e => setDeptId(e.target.value)} className="input">
                <option value="">Select a department</option>
                {departments?.filter(d => d.id !== user?.department?.id).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="input"
                placeholder="Explain why you need to change departments..."
              />
            </div>
            <button
              onClick={() => submitDeptChange.mutate()}
              disabled={!deptId || submitDeptChange.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitDeptChange.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>

        {/* My requests */}
        {myRequests?.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">My Department Requests</h3>
            <div className="space-y-3">
              {myRequests.map(req => (
                <div key={req.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      → {req.requested_department_name}
                    </p>
                    {req.reason && <p className="text-xs text-gray-500 mt-0.5">{req.reason}</p>}
                    {req.review_note && <p className="text-xs text-red-500 mt-0.5">Note: {req.review_note}</p>}
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(req.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <span className={statusBadge[req.status] || 'badge bg-gray-100 text-gray-600'}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
