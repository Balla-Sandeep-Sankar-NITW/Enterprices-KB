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
    pending: 'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide shadow-sm bg-amber-500/10 text-amber-400 border border-amber-500/20',
    approved: 'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide shadow-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected: 'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide shadow-sm bg-rose-500/10 text-rose-400 border border-rose-500/20',
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0d0f13] text-slate-200">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account settings</p>
        </div>

        {/* User info card */}
        <div className="bg-[#13151a] border border-white/[0.06] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/[0.01] via-transparent to-transparent" />
          
          <div className="relative flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center shadow-inner">
              <User className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{user?.full_name}</h2>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={clsx('inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide border shadow-sm', user?.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20')}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role}
                </span>
                <span className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide border shadow-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {user?.status}
                </span>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-4 text-sm border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{user?.department?.name || 'No department'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Joined {user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : '—'}</span>
            </div>
          </div>
        </div>

        {/* Edit name */}
        <div className="bg-[#13151a] border border-white/[0.06] rounded-2xl p-6 shadow-xl">
          <h3 className="font-semibold text-slate-100 text-base mb-4">Edit Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-orange-400/80 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending || !fullName.trim()}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-white/[0.04] text-white disabled:text-slate-600 text-sm font-semibold transition-all shadow-md active:scale-[0.98] disabled:pointer-events-none"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Department change request */}
        <div className="bg-[#13151a] border border-white/[0.06] rounded-2xl p-6 shadow-xl">
          <h3 className="font-semibold text-slate-100 text-base mb-1">Request Department Change</h3>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">Submit a request to move to a different department. An admin will review it.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-orange-400/80 mb-2">Requested Department</label>
              <select 
                value={deptId} 
                onChange={e => setDeptId(e.target.value)} 
                className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
              >
                <option value="" className="bg-[#13151a]">Select a department</option>
                {departments?.filter(d => d.id !== user?.department?.id).map(d => (
                  <option key={d.id} value={d.id} className="bg-[#13151a]">{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-orange-400/80 mb-2">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all resize-none"
                placeholder="Explain why you need to change departments..."
              />
            </div>
            <button
              onClick={() => submitDeptChange.mutate()}
              disabled={!deptId || submitDeptChange.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-white/[0.04] text-white disabled:text-slate-600 text-sm font-semibold transition-all shadow-md active:scale-[0.98] disabled:pointer-events-none"
            >
              <Send className="w-4 h-4" />
              {submitDeptChange.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>

        {/* My requests */}
        {myRequests?.length > 0 && (
          <div className="bg-[#13151a] border border-white/[0.06] rounded-2xl p-6 shadow-xl">
            <h3 className="font-semibold text-slate-100 text-base mb-4">My Department Requests</h3>
            <div className="space-y-3">
              {myRequests.map(req => (
                <div key={req.id} className="flex items-start justify-between p-3.5 bg-[#0d0f13] border border-white/[0.04] rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      → {req.requested_department_name}
                    </p>
                    {req.reason && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{req.reason}</p>}
                    {req.review_note && <p className="text-xs text-rose-400 mt-1 font-medium">Note: {req.review_note}</p>}
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">{format(new Date(req.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <span className={statusBadge[req.status] || 'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide shadow-sm bg-white/[0.04] text-slate-400 border border-white/[0.06]'}>
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