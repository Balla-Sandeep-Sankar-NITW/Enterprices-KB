import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search, Filter, File, FileSpreadsheet, AlertCircle, CheckCircle, Clock, Loader } from 'lucide-react'
import { documentsApi } from '@/api/client'
import { format } from 'date-fns'
import clsx from 'clsx'

const statusConfig = {
  processed: { label: 'Ready', icon: CheckCircle, className: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' },
  processing: { label: 'Processing', icon: Loader, className: 'text-orange-400 bg-orange-500/10 border border-orange-500/20' },
  uploaded: { label: 'Queued', icon: Clock, className: 'text-amber-400 bg-amber-500/10 border border-amber-500/20' },
  failed: { label: 'Failed', icon: AlertCircle, className: 'text-rose-400 bg-rose-500/10 border border-rose-500/20' },
}

const fileIcons = {
  pdf: { icon: FileText, color: 'text-rose-400 bg-rose-500/10 border border-rose-500/20' },
  docx: { icon: FileText, color: 'text-orange-400 bg-orange-500/10 border border-orange-500/20' },
  txt: { icon: File, color: 'text-slate-400 bg-white/[0.04] border border-white/[0.06]' },
  xlsx: { icon: FileSpreadsheet, color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' },
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['documents', search, page],
    queryFn: () => documentsApi.list({ search, page, per_page: 20 }).then(r => r.data),
  })

  return (
    <div className="h-full flex flex-col bg-[#0d0f13] text-slate-200">
      {/* Header */}
      <div className="bg-[#13151a] border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Documents</h1>
            <p className="text-sm text-slate-400 mt-0.5">Browse your department's knowledge base</p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-[#0d0f13] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : !data?.documents?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">No documents found</p>
            <p className="text-slate-500 text-sm">Your department hasn't uploaded any documents yet.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {data.documents.map(doc => {
                const fileConfig = fileIcons[doc.file_type] || fileIcons.txt
                const FileIcon = fileConfig.icon
                const statusInfo = statusConfig[doc.status] || statusConfig.uploaded
                const StatusIcon = statusInfo.icon

                return (
                  <div key={doc.id} className="bg-[#13151a] border border-white/[0.06] rounded-2xl p-4 hover:border-orange-500/30 transition-all shadow-md">
                    <div className="flex items-start gap-4">
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner', fileConfig.color)}>
                        <FileIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-100 truncate text-sm sm:text-base">{doc.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.original_filename}</p>
                          </div>
                          <span className={clsx('flex items-center text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full shrink-0', statusInfo.className)}>
                            <StatusIcon className={clsx('w-3 h-3 mr-1', doc.status === 'processing' && 'animate-spin')} />
                            {statusInfo.label}
                          </span>
                        </div>

                        {doc.description && (
                          <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">{doc.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 font-medium">
                          <span>{formatBytes(doc.file_size)}</span>
                          {doc.total_pages && <span>• &nbsp;{doc.total_pages} pages</span>}
                          {doc.total_chunks && <span>• &nbsp;{doc.total_chunks} chunks</span>}
                          <span>• &nbsp;by {doc.uploaded_by_name}</span>
                          <span>• &nbsp;{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                        </div>

                        {doc.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {doc.tags.map(tag => (
                              <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.04]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.06] bg-[#13151a] text-slate-300 hover:text-orange-400 disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-400 font-medium">Page {page} of {data.pages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))} 
                  disabled={page === data.pages} 
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.06] bg-[#13151a] text-slate-300 hover:text-orange-400 disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}