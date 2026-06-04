import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, CheckCircle, XCircle, Trash2,
  Loader, UserCheck, ChevronDown, ChevronUp,
  Building2, Calendar, Shield
} from 'lucide-react'
import { adminApi } from '@/api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

/* ─── Status badge config ────────────────────────────────────────────────── */
const statusColors = {
  active:           'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  pending_approval: 'bg-orange-500/10  text-orange-400  border border-orange-500/20',
  pending_email:    'bg-amber-500/10   text-amber-300   border border-amber-500/20',
  rejected:         'bg-rose-500/10    text-rose-400    border border-rose-500/20',
  suspended:        'bg-amber-600/10   text-amber-500   border border-amber-600/20',
}

/* ─── Human-readable status labels (avoids raw underscore strings) ────────── */
const statusLabel = {
  active:           'Active',
  pending_approval: 'Pending',      // shortened for badge on mobile
  pending_email:    'Email Verify',
  rejected:         'Rejected',
  suspended:        'Suspended',
}

/* ═══════════════════════════════════════════════════════════════════════════
 * AdminUsers — Main page component
 * ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminUsers() {
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]                 = useState(1)
  const [approveModal, setApproveModal] = useState(null)
  const [selectedDept, setSelectedDept] = useState('')
  const qc = useQueryClient()

  /* ── Queries ── */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, statusFilter, page],
    queryFn: () =>
      adminApi.users({ search, status: statusFilter, page, per_page: 20 }).then(r => r.data),
  })

  const { data: departments } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => adminApi.departments().then(r => r.data),
  })

  /* ── Mutations ── */
  const approveMutation = useMutation({
    mutationFn: ({ userId, deptId }) =>
      adminApi.approveUser(userId, { department_id: deptId }),
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
    mutationFn: (userId) =>
      adminApi.rejectUser(userId, { reason: 'Not approved by admin' }),
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

  /* ── Handlers ── */
  const handleDelete = (userId) => {
    if (confirm('Delete this user?')) deleteMutation.mutate(userId)
  }

  /* ── Render ── */
  return (
    <div className="h-full flex flex-col bg-[#0d0f13]">

      {/* ══════════════════════════════════════════════════════
       * HEADER
       * FIX 1 — Responsive horizontal padding: px-4 on mobile,
       *          px-6 on sm+. Prevents filter controls from
       *          overflowing on 320px viewports.
       * FIX 2 — Filter row stacks vertically on mobile with
       *          flex-col, goes side-by-side from sm+.
       * ════════════════════════════════════════════════════*/}
      <div className="bg-[#13151a] border-b border-white/[0.06] px-4 sm:px-6 py-4 sm:py-5 relative overflow-hidden shrink-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] via-transparent to-transparent" />

        <div className="relative">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f1f5f9]">
            User Management
          </h1>
          <p className="text-sm text-[#94a3b8] mt-0.5">
            Approve, manage, and monitor system users
          </p>
        </div>

        {/* Filter controls — stack on mobile, row on sm+ */}
        <div className="relative flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Status filter — full width on mobile, fixed width on sm+ */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="w-full sm:w-48 rounded-xl border border-white/[0.06] bg-[#0d0f13] px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
          >
            <option value=""               className="bg-[#13151a]">All statuses</option>
            <option value="active"         className="bg-[#13151a]">Active</option>
            <option value="pending_approval" className="bg-[#13151a]">Pending Approval</option>
            <option value="pending_email"  className="bg-[#13151a]">Pending Email</option>
            <option value="rejected"       className="bg-[#13151a]">Rejected</option>
          </select>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
       * CONTENT AREA
       * FIX 3 — Responsive padding on the scroll container.
       *          p-3 on mobile keeps the table/cards from
       *          being flush with the screen edge while not
       *          wasting horizontal space.
       * ════════════════════════════════════════════════════*/}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        {isLoading ? (
          <div className="flex justify-center h-32 items-center">
            <Loader className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* ════════════════════════════════════════════════
             * MOBILE + TABLET: Card List  (below md / <768px)
             *
             * FIX 4 (CORE FIX) — Replaced the broken card
             * expand-to-see approach. Cards now ALWAYS show
             * all data — name, email, dept, role, joined,
             * status — in a clean structured layout. Nothing
             * is hidden behind a tap.
             *
             * Actions are always visible at the bottom of
             * each card at 44px touch height (Apple HIG min).
             *
             * Pending-approval users get a visual highlight
             * (orange left border) so admins can triage fast.
             * ══════════════════════════════════════════════*/}
            <div className="md:hidden space-y-3">
              {data?.users?.map(u => (
                <UserCard
                  key={u.id}
                  user={u}
                  onApprove={() => setApproveModal(u)}
                  onReject={() => rejectMutation.mutate(u.id)}
                  onDelete={() => handleDelete(u.id)}
                  rejectPending={rejectMutation.isPending}
                  deletePending={deleteMutation.isPending}
                />
              ))}
              {!data?.users?.length && (
                <div className="text-center py-16 text-slate-500 font-medium">
                  No users found
                </div>
              )}
            </div>

            {/* ════════════════════════════════════════════════
             * DESKTOP: Full table  (md+ / ≥768px)
             * Preserved exactly — no changes to desktop layout.
             * ══════════════════════════════════════════════*/}
            <div className="hidden md:block relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#13151a] shadow-2xl shadow-black/40">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent" />
              <table className="w-full text-sm relative">
                <thead className="bg-[#181a21] border-b border-white/[0.06]">
                  <tr>
                    {['Name','Email','Department','Status','Role','Joined','Actions'].map(h => (
                      <th
                        key={h}
                        className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-orange-400/80"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data?.users?.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="px-5 py-4 font-semibold text-slate-300 group-hover:text-white transition-colors">
                        {u.full_name}
                      </td>
                      <td className="px-5 py-4 text-slate-300 font-medium">{u.email}</td>
                      <td className="px-5 py-4 text-slate-300 font-medium">
                        {u.department?.name || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={clsx(
                          'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize shadow-sm tracking-wide',
                          statusColors[u.status] || 'bg-white/[0.04] text-slate-300'
                        )}>
                          {u.status.replace(/_/g, ' ')}
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
                      <td className="px-5 py-4 text-slate-300 font-medium">
                        {format(new Date(u.created_at), 'MMM d, yy')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {u.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => setApproveModal(u)}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all hover:scale-105"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => rejectMutation.mutate(u.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all hover:scale-105"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all hover:scale-105"
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
                <div className="text-center py-16 text-slate-500 relative font-medium">
                  No system records found
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════
         * PAGINATION
         * FIX 5 — pb-4 ensures the pagination row is not
         *          hidden behind a fixed bottom nav bar on
         *          mobile. whitespace-nowrap on the page
         *          counter stops it wrapping awkwardly.
         * ══════════════════════════════════════════════*/}
        {data?.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 sm:mt-6 pb-4 sm:pb-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 sm:px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:pointer-events-none"
            >
              Prev
            </button>
            <span className="text-sm text-slate-400 font-medium px-2 whitespace-nowrap">
              Page <span className="text-orange-400">{page}</span> of {data.pages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === data.pages}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 sm:px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
       * APPROVE MODAL
       * FIX 6 — On mobile: bottom sheet pattern (items-end,
       *          rounded-t-2xl). Full width, easy to reach
       *          with thumbs. On sm+: centered dialog as before.
       * FIX 7 — Removed backdrop-blur-md (GPU jank on Android).
       *          Replaced with a simple semi-transparent overlay.
       * ════════════════════════════════════════════════════*/}
      {approveModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 sm:p-4"
          onClick={e => { if (e.target === e.currentTarget) { setApproveModal(null); setSelectedDept('') } }}
        >
          <div className="relative overflow-hidden w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-white/[0.08] bg-[#13151a] p-4 sm:p-6 shadow-2xl shadow-black/90">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/[0.04] to-transparent" />

            {/* Drag handle — visual cue that this is a sheet on mobile */}
            <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            <div className="relative flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-[#f1f5f9] text-base sm:text-lg tracking-tight leading-tight">
                  Approve System Access
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed">
                  Assign a department to{' '}
                  <strong className="text-white font-semibold">{approveModal.full_name}</strong>
                </p>
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-widest text-orange-400/80 mb-2">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-[#0d0f13] px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-colors mb-4 sm:mb-5"
              >
                <option value="" className="bg-[#13151a]">Select a department…</option>
                {departments?.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#13151a]">{d.name}</option>
                ))}
              </select>
            </div>

            <div className="relative flex gap-2 sm:gap-3">
              <button
                onClick={() =>
                  approveMutation.mutate({
                    userId: approveModal.id,
                    deptId: parseInt(selectedDept),
                  })
                }
                disabled={!selectedDept || approveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 px-4 py-2.5 text-sm font-semibold transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              >
                {approveMutation.isPending
                  ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Processing…</>
                  : <><CheckCircle className="w-3.5 h-3.5" /> Grant Access</>
                }
              </button>
              <button
                onClick={() => { setApproveModal(null); setSelectedDept('') }}
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

/* ═══════════════════════════════════════════════════════════════════════════
 * UserCard — Mobile card component
 *
 * WHAT CHANGED vs. the original:
 *
 * 1. ALWAYS EXPANDED — All data visible immediately. No tap required.
 *    Admins on mobile need to scan users fast; hiding info behind taps
 *    creates unnecessary friction.
 *
 * 2. STRUCTURED INFO GRID — Department, Role, Joined shown in a clean
 *    2-column dl grid below the header. Labels are small/muted, values
 *    are prominent.
 *
 * 3. PENDING HIGHLIGHT — Cards with status=pending_approval get an orange
 *    left border accent so admins can spot action items instantly.
 *
 * 4. TOUCH-SAFE ACTIONS — All action buttons are h-10 (40px). Approve and
 *    Reject get full-width flex-1 buttons with icon + label. Delete is
 *    narrower when other actions are present (icon only), full-width when
 *    it's the only action.
 *
 * 5. EMAIL TRUNCATION — Long emails truncate with ellipsis rather than
 *    wrapping onto 3 lines or overflowing.
 *
 * 6. REMOVED expand/collapse toggle — Eliminated the ChevronDown/Up
 *    accordion. Simpler, faster, more scannable.
 * ═══════════════════════════════════════════════════════════════════════════ */
function UserCard({ user: u, onApprove, onReject, onDelete, rejectPending, deletePending }) {
  const isPending = u.status === 'pending_approval'

  return (
    <div className={clsx(
      'bg-[#13151a] border border-white/[0.06] rounded-xl overflow-hidden transition-colors',
      isPending && 'border-l-2 border-l-orange-500/50'   // visual triage cue
    )}>

      {/* ── Card header: avatar · name · email · status badge ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Avatar */}
        <div className={clsx(
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm',
          isPending
            ? 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
            : 'bg-white/[0.06] border border-white/[0.08] text-slate-300'
        )}>
          {u.full_name?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
            {u.full_name}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
        </div>

        {/* Status badge — uses shortened labels to prevent overflow */}
        <span className={clsx(
          'shrink-0 inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold',
          statusColors[u.status] || 'bg-white/[0.04] text-slate-300'
        )}>
          {statusLabel[u.status] ?? u.status}
        </span>
      </div>

      {/* ── Info grid: dept · role · joined ── */}
      <div className="px-4 pb-3 border-t border-white/[0.04]">
        <dl className="grid grid-cols-3 gap-x-2 mt-3">
          {/* Department */}
          <div className="min-w-0">
            <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              <Building2 className="w-2.5 h-2.5" />
              Dept
            </dt>
            <dd className="text-xs text-slate-300 font-medium truncate">
              {u.department?.name || <span className="text-slate-600">—</span>}
            </dd>
          </div>

          {/* Role */}
          <div className="min-w-0">
            <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              <Shield className="w-2.5 h-2.5" />
              Role
            </dt>
            <dd>
              <span className={clsx(
                'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold border capitalize',
                u.role === 'admin'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
              )}>
                {u.role}
              </span>
            </dd>
          </div>

          {/* Joined */}
          <div className="min-w-0">
            <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              <Calendar className="w-2.5 h-2.5" />
              Joined
            </dt>
            <dd className="text-xs text-slate-300 font-medium">
              {format(new Date(u.created_at), 'MMM d, yy')}
            </dd>
          </div>
        </dl>

        {/* ── Action buttons ── */}
        <div className="flex gap-2 mt-4">
          {isPending ? (
            <>
              {/* Approve */}
              <button
                onClick={onApprove}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Approve
              </button>

              {/* Reject */}
              <button
                onClick={onReject}
                disabled={rejectPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                Reject
              </button>

              {/* Delete (icon only when 3 buttons) */}
              <button
                onClick={onDelete}
                disabled={deletePending}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 bg-white/[0.04] border border-white/[0.08] hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                title="Delete user"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            /* Only delete available for non-pending users */
            <button
              onClick={onDelete}
              disabled={deletePending}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-semibold text-slate-400 bg-white/[0.04] border border-white/[0.08] hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              Delete User
            </button>
          )}
        </div>
      </div>
    </div>
  )
}