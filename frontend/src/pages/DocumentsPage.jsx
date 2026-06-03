import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search, Filter, File, FileSpreadsheet, AlertCircle, CheckCircle, Clock, Loader } from 'lucide-react'
import { documentsApi } from '@/api/client'
import { format } from 'date-fns'
import clsx from 'clsx'

const statusConfig = {
  processed: { label: 'Ready', icon: CheckCircle, className: 'text-green-600 bg-green-50' },
  processing: { label: 'Processing', icon: Loader, className: 'text-blue-600 bg-blue-50' },
  uploaded: { label: 'Queued', icon: Clock, className: 'text-yellow-600 bg-yellow-50' },
  failed: { label: 'Failed', icon: AlertCircle, className: 'text-red-600 bg-red-50' },
}

const fileIcons = {
  pdf: { icon: FileText, color: 'text-red-500 bg-red-50' },
  docx: { icon: FileText, color: 'text-blue-500 bg-blue-50' },
  txt: { icon: File, color: 'text-gray-500 bg-gray-50' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-500 bg-green-50' },
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-500 mt-0.5">Browse your department's knowledge base</p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        ) : !data?.documents?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No documents found</p>
            <p className="text-gray-400 text-sm">Your department hasn't uploaded any documents yet.</p>
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
                  <div key={doc.id} className="card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', fileConfig.color)}>
                        <FileIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{doc.original_filename}</p>
                          </div>
                          <span className={clsx('badge shrink-0', statusInfo.className)}>
                            <StatusIcon className={clsx('w-3 h-3 mr-1', doc.status === 'processing' && 'animate-spin')} />
                            {statusInfo.label}
                          </span>
                        </div>

                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{doc.description}</p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>{formatBytes(doc.file_size)}</span>
                          {doc.total_pages && <span>{doc.total_pages} pages</span>}
                          {doc.total_chunks && <span>{doc.total_chunks} chunks</span>}
                          <span>by {doc.uploaded_by_name}</span>
                          <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                        </div>

                        {doc.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags.map(tag => (
                              <span key={tag} className="badge bg-gray-100 text-gray-600">{tag}</span>
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
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm">Previous</button>
                <span className="text-sm text-gray-600">Page {page} of {data.pages}</span>
                <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-secondary px-3 py-1.5 text-sm">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
