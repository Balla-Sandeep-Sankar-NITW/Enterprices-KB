import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Pencil, Trash2, Users, FileText, Loader, X, Check } from 'lucide-react'
import { adminApi } from '@/api/client'
import toast from 'react-hot-toast'

export default function AdminDepartments() {
  const [showForm, setShowForm] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const qc = useQueryClient()

  const { data: departments, isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => adminApi.departments().then(r => r.data),
  })

  const { data: changeRequests } = useQuery({
    queryKey: ['dept-change-requests'],
    queryFn: () => adminApi.deptChangeRequests('pending').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createDepartment(form),
    onSuccess: () => {
      toast.success('Department created')
      qc.invalidateQueries(['admin-departments'])
      setShowForm(false)
      setForm({ name: '', description: '' })
    },
    onError: err => toast.error(err.response?.data?.detail || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateDepartment(editingDept.id, form),
    onSuccess: () => {
      toast.success('Department updated')
      qc.invalidateQueries(['admin-departments'])
      setEditingDept(null)
      setForm({ name: '', description: '' })
    },
    onError: err => toast.error(err.response?.data?.detail || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteDepartment(id),
    onSuccess: () => {
      toast.success('Department deleted')
      qc.invalidateQueries(['admin-departments'])
    },
    onError: err => toast.error(err.response?.data?.detail || 'Cannot delete'),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }) => adminApi.reviewDeptChange(id, { action }),
    onSuccess: (_, { action }) => {
      toast.success(`Request ${action}d`)
      qc.invalidateQueries(['dept-change-requests'])
      qc.invalidateQueries(['admin-users'])
    },
    onError: () => toast.error('Failed'),
  })

  const openEdit = (dept) => {
    setEditingDept(dept)
    setForm({ name: dept.name, description: dept.description || '' })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Department name is required')
    editingDept ? updateMutation.mutate() : createMutation.mutate()
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingDept(null)
    setForm({ name: '', description: '' })
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0d0f13] p-6">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Departments</h1>
            <p className="mt-1 text-sm text-slate-400">Manage departments and access control</p>
          </div>
          <button
            onClick={() => { cancelForm(); setShowForm(true) }}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Department
          </button>
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#13151a] p-6">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent" />
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-slate-200">
              {editingDept ? 'Edit Department' : 'Create Department'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-300">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all focus:border-amber-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-amber-500/10"
                  placeholder="e.g. Human Resources"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-300">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all focus:border-amber-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-amber-500/10"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingDept ? 'Update' : 'Create'
                  }
                </button>
                <button
                  onClick={cancelForm}
                  className="rounded-xl border border-white/[0.10] bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:border-white/[0.20] hover:bg-white/[0.10] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Departments list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader className="h-5 w-5 animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="grid gap-3">
            {departments?.map(dept => (
              <div
                key={dept.id}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#13151a] p-5 transition-all duration-200 hover:border-white/[0.14] hover:shadow-xl hover:shadow-black/30"
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent" />
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                      <Building2 className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{dept.name}</h3>
                      {dept.description && (
                        <p className="mt-0.5 text-sm text-slate-300">{dept.description}</p>
                      )}
                      <div className="mt-2.5 flex items-center gap-4 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-slate-400" />
                          {dept.user_count ?? 0} users
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-slate-400" />
                          {dept.document_count ?? 0} documents
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(dept)}
                      className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${dept.name}"?`)) deleteMutation.mutate(dept.id) }}
                      className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!departments?.length && (
              <div className="py-16 text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">
                  No departments yet. Create one to get started.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pending department change requests */}
        {changeRequests?.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#13151a] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-200">
              Pending Department Change Requests
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400">
                {changeRequests.length}
              </span>
            </h2>
            <div className="space-y-2">
              {changeRequests.map(req => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-4 py-3 transition-colors hover:border-amber-500/20"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{req.user_name}</p>
                    <p className="text-xs font-medium text-slate-300">
                      {req.current_department_name || 'No dept'} → <strong className="text-amber-400">{req.requested_department_name}</strong>
                    </p>
                    {req.reason && (
                      <p className="mt-0.5 text-xs text-slate-400">"{req.reason}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewMutation.mutate({ id: req.id, action: 'approve' })}
                      className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400 transition-colors hover:bg-emerald-500/20"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => reviewMutation.mutate({ id: req.id, action: 'reject' })}
                      className="rounded-lg bg-rose-500/10 p-1.5 text-rose-400 transition-colors hover:bg-rose-500/20"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}