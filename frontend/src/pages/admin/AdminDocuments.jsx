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

// Updated for glowing accents on a dark layout
const statusConfig = {
  processed: { label: 'Ready', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  processing: { label: 'Processing', icon: Loader, className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', spin: true },
  uploaded: { label: 'Queued', icon: Clock, className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  failed: { label: 'Failed', icon: AlertCircle, className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
}

// Updated for vibrant document tags against dark surfaces
const fileIconMap = {
  pdf: { icon: FileText, color: 'text-rose-400 bg-rose-500/10' },
  docx: { icon: FileText, color: 'text-blue-400 bg-blue-500/10' },
  txt: { icon: File, color: 'text-slate-400 bg-slate-500/10' },
  xlsx: { icon: FileSpreadsheet, color: 'text-emerald-400 bg-emerald-500/10' },
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
    refetchInterval: 10000,
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
    <div className="h-full flex flex-col bg-[#0d0f13]">
      {/* Header */}
      <div className="bg-[#13151a] border-b border-white/[0.06] px-6 py-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Documents</h1>
            <p className="text-sm text-slate-300 mt-0.5">Upload and manage knowledge base documents</p>
          </div>
          <button 
            onClick={() => setShowUpload(true)} 
            className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/20 shadow-lg shadow-black/20"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        <div className="relative flex gap-3 mt-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </div>
          <select 
            value={deptFilter} 
            onChange={e => { setDeptFilter(e.target.value); setPage(1) }} 
            className="rounded-xl border border-white/[0.06] bg-[#0d0f13] px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-white/[0.15] transition-colors w-48"
          >
            <option value="" className="bg-[#13151a]">All departments</option>
            {departments?.map(d => <option key={d.id} value={d.id} className="bg-[#13151a]">{d.name}</option>)}
          </select>
          <button 
            onClick={() => refetch()} 
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-slate-100 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader className="w-5 h-5 animate-spin text-amber-400" /></div>
        ) : !data?.documents?.length ? (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 text-slate-300" />
            <p className="font-medium text-slate-200">No documents yet</p>
            <p className="text-sm text-slate-400">Upload your first document to get started.</p>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#13151a] shadow-xl shadow-black/20">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
              <table className="w-full text-sm relative">
                <thead className="bg-[#181a21] border-b border-white/[0.06]">
                  <tr>
                    {['Document', 'Department', 'Size', 'Pages', 'Status', 'Uploaded', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-medium uppercase tracking-widest text-slate-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data.documents.map(doc => {
                    const fileConf = fileIconMap[doc.file_type] || fileIconMap.txt
                    const FileIcon = fileConf.icon
                    const st = statusConfig[doc.status] || statusConfig.uploaded
                    const StatusIcon = st.icon

                    return (
                      <tr key={doc.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner', fileConf.color)}>
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-100 truncate max-w-[200px] group-hover:text-white transition-colors">{doc.title}</p>
                              <p className="text-xs text-slate-300 truncate max-w-[200px] mt-0.5">{doc.original_filename}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">{doc.department_name || '—'}</td>
                        <td className="px-5 py-3.5 text-slate-300">{formatBytes(doc.file_size)}</td>
                        <td className="px-5 py-3.5 text-slate-300">{doc.total_pages ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={clsx('inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm', st.className)}>
                            <StatusIcon className={clsx('w-3 h-3 mr-1.5', st.spin && 'animate-spin')} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">{format(new Date(doc.created_at), 'MMM d, yy')}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            {doc.status === 'failed' && (
                              <button
                                onClick={() => reprocessMutation.mutate(doc.id)}
                                className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
                                title="Reprocess"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => { if (confirm('Delete this document?')) deleteMutation.mutate(doc.id) }}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all"
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
              <div className="flex justify-center gap-2 mt-5">
                <button 
                  onClick={() => setPage(p => p - 1)} 
                  disabled={page === 1} 
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-300 py-1.5 px-2">Page {page} of {data.pages}</span>
                <button 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={page === data.pages} 
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#13151a] p-6 max-w-lg w-full shadow-2xl shadow-black/80">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
            
            <div className="relative flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-100 text-lg tracking-tight">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative space-y-4">
              {/* File drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300',
                  selectedFile 
                    ? 'border-amber-500/40 bg-amber-500/[0.03]' 
                    : 'border-white/[0.1] bg-[#0d0f13] hover:border-white/[0.2] hover:bg-white/[0.02]'
                )}
              >
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.xlsx" onChange={handleFileChange} />
                {selectedFile ? (
                  <div>
                    <FileText className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="font-medium text-slate-200 text-sm truncate max-w-xs mx-auto">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatBytes(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-300">Click to select file</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT, XLSX — max 50MB</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-slate-300 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] px-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-white/[0.15] transition-colors"
                  placeholder="Document title"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-slate-300 mb-1.5">Department *</label>
                <select
                  value={uploadForm.department_id}
                  onChange={e => setUploadForm({ ...uploadForm, department_id: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-white/[0.15] transition-colors"
                >
                  <option value="" className="bg-[#13151a]">Select department</option>
                  {departments?.map(d => <option key={d.id} value={d.id} className="bg-[#13151a]">{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] px-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-white/[0.15] transition-colors resize-none"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-slate-300 mb-1.5">Tags</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={e => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] px-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-white/[0.15] transition-colors"
                  placeholder="hr, policy, leave (comma separated)"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!selectedFile || !uploadForm.title || !uploadForm.department_id || uploadMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/20 disabled:opacity-30 disabled:pointer-events-none"
                >
                  {uploadMutation.isPending ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Upload</>
                  )}
                </button>
                <button 
                  onClick={() => setShowUpload(false)} 
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}