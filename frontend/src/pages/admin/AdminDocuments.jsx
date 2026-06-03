import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload, Search, Trash2, RefreshCw, FileText, File,
  FileSpreadsheet, CheckCircle, AlertCircle, Clock, Loader, Plus, X
} from 'lucide-react'
import { documentsApi, adminApi } from '@/api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

const statusConfig = {
  processed: { label: 'Ready', icon: CheckCircle, className: 'bg-green-50 text-green-700' },
  processing: { label: 'Processing', icon: Loader, className: 'bg-blue-50 text-blue-700', spin: true },
  uploaded: { label: 'Queued', icon: Clock, className: 'bg-yellow-50 text-yellow-700' },
  failed: { label: 'Failed', icon: AlertCircle, className: 'bg-red-50 text-red-700' },
}

const fileIconMap = {
  pdf: { icon: FileText, color: 'text-red-500 bg-red-50' },
  docx: { icon: FileText, color: 'text-blue-500 bg-blue-50' },
  txt: { icon: File, color: 'text-gray-500 bg-gray-50' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-500 bg-green-50' },
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function AdminDocuments() {
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  // Upload form state
  const [uploadForm, setUploadForm] = useState({ title: '', department_id: '', description: '', tags: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-documents', search, deptFilter, page],
    queryFn: () => documentsApi.list({ search, department_id: deptFilter || undefined, page, per_page: 20 }).then(r => r.data),
    refetchInterval: 10000, // Poll for processing status
  })

  const { data: departments } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => adminApi.departments().then(r => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('title', uploadForm.title)
      fd.append('department_id', uploadForm.department_id)
      if (uploadForm.description) fd.append('description', uploadForm.description)
      if (uploadForm.tags) fd.append('tags', uploadForm.tags)
      return documentsApi.upload(fd)
    },
    onSuccess: () => {
      toast.success('Document uploaded and queued for processing')
      qc.invalidateQueries(['admin-documents'])
      setShowUpload(false)
      setUploadForm({ title: '', department_id: '', description: '', tags: '' })
      setSelectedFile(null)
    },
    onError: err => toast.error(err.response?.data?.detail || 'Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => documentsApi.delete(id),
    onSuccess: () => {
      toast.success('Document deleted')
      qc.invalidateQueries(['admin-documents'])
    },
    onError: () => toast.error('Failed to delete'),
  })

  const reprocessMutation = useMutation({
    mutationFn: (id) => documentsApi.reprocess(id),
    onSuccess: () => {
      toast.success('Document queued for reprocessing')
      qc.invalidateQueries(['admin-documents'])
    },
    onError: () => toast.error('Failed'),
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    if (!uploadForm.title) {
      setUploadForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }))
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-500 mt-0.5">Upload and manage knowledge base documents</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        <div className="flex gap-3 mt-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input pl-9"
            />
          </div>
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1) }} className="input w-48">
            <option value="">All departments</option>
            {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button onClick={() => refetch()} className="btn-secondary flex items-center gap-1.5 text-sm px-3">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader className="w-5 h-5 animate-spin text-primary-600" /></div>
        ) : !data?.documents?.length ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No documents yet</p>
            <p className="text-sm">Upload your first document to get started.</p>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Document', 'Department', 'Size', 'Pages', 'Status', 'Uploaded', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.documents.map(doc => {
                    const fileConf = fileIconMap[doc.file_type] || fileIconMap.txt
                    const FileIcon = fileConf.icon
                    const st = statusConfig[doc.status] || statusConfig.uploaded
                    const StatusIcon = st.icon

                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', fileConf.color)}>
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">{doc.title}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{doc.original_filename}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{doc.department_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{formatBytes(doc.file_size)}</td>
                        <td className="px-4 py-3 text-gray-500">{doc.total_pages ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('badge', st.className)}>
                            <StatusIcon className={clsx('w-3 h-3 mr-1', st.spin && 'animate-spin')} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{format(new Date(doc.created_at), 'MMM d, yy')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {doc.status === 'failed' && (
                              <button
                                onClick={() => reprocessMutation.mutate(doc.id)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Reprocess"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => { if (confirm('Delete this document?')) deleteMutation.mutate(doc.id) }}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {data.pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary text-sm px-3 py-1.5">Prev</button>
                <span className="text-sm text-gray-600 py-1.5">Page {page} of {data.pages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page === data.pages} className="btn-secondary text-sm px-3 py-1.5">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                  selectedFile ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
                )}
              >
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.xlsx" onChange={handleFileChange} />
                {selectedFile ? (
                  <div>
                    <FileText className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Click to select file</p>
                    <p className="text-xs text-gray-400">PDF, DOCX, TXT, XLSX — max 50MB</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="input"
                  placeholder="Document title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  value={uploadForm.department_id}
                  onChange={e => setUploadForm({ ...uploadForm, department_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select department</option>
                  {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={e => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  className="input"
                  placeholder="hr, policy, leave (comma separated)"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!selectedFile || !uploadForm.title || !uploadForm.department_id || uploadMutation.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {uploadMutation.isPending ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Upload</>
                  )}
                </button>
                <button onClick={() => setShowUpload(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
