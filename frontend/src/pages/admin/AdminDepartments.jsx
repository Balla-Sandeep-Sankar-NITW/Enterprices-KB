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
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage departments and access control</p>
          </div>
          <button onClick={() => { cancelForm(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Department
          </button>
        </div>

        {/* Create/Edit form */}
        {showForm && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              {editingDept ? 'Edit Department' : 'Create Department'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Human Resources"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingDept ? 'Update' : 'Create'}
                </button>
                <button onClick={cancelForm} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Departments list */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader className="w-5 h-5 animate-spin text-primary-600" /></div>
        ) : (
          <div className="grid gap-4">
            {departments?.map(dept => (
              <div key={dept.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      {dept.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{dept.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {dept.user_count ?? 0} users
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {dept.document_count ?? 0} documents
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(dept)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${dept.name}"?`)) deleteMutation.mutate(dept.id) }}
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!departments?.length && (
              <div className="text-center py-12 text-gray-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No departments yet. Create one to get started.
              </div>
            )}
          </div>
        )}

        {/* Pending dept change requests */}
        {changeRequests?.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Pending Department Change Requests ({changeRequests.length})
            </h2>
            <div className="space-y-3">
              {changeRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{req.user_name}</p>
                    <p className="text-xs text-gray-500">
                      {req.current_department_name || 'No dept'} → <strong>{req.requested_department_name}</strong>
                    </p>
                    {req.reason && <p className="text-xs text-gray-400 mt-0.5">"{req.reason}"</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewMutation.mutate({ id: req.id, action: 'approve' })}
                      className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => reviewMutation.mutate({ id: req.id, action: 'reject' })}
                      className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
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
