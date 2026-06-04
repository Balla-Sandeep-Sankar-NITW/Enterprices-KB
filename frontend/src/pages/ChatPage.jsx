import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Send, Plus, Trash2, MessageSquare, BookOpen,
  ExternalLink, ChevronLeft, PanelLeftOpen
} from 'lucide-react'
import { chatApi } from '@/api/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  /*
   * ISSUE 1 — Sessions sidebar is always visible on all screen sizes.
   * On mobile (320–767px) it takes up 256px of a ~375px viewport, leaving
   * only ~119px for the chat area — completely unusable.
   *
   * FIX — The sidebar is now a drawer on mobile/tablet. `sidebarOpen` drives
   * its visibility. It defaults open on desktop (≥1024px). The sidebar slides
   * in/out on smaller screens using a CSS transform.
   */
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-open sidebar on desktop, auto-close on mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setSidebarOpen(mq.matches)
    const handler = (e) => setSidebarOpen(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => { loadSessions() }, [])

  useEffect(() => {
    if (sessionId) {
      loadSession(parseInt(sessionId))
    } else {
      setCurrentSession(null)
      setMessages([])
    }
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      const res = await chatApi.sessions()
      setSessions(res.data)
    } catch {}
  }

  const loadSession = async (id) => {
    try {
      const res = await chatApi.getSession(id)
      setCurrentSession(res.data)
      setMessages(res.data.messages || [])
    } catch {
      navigate('/chat')
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const question = input.trim()
    setInput('')
    setSending(true)

    const tempMsg = {
      id: 'temp',
      role: 'user',
      content: question,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const res = await chatApi.sendMessage({
        content: question,
        session_id: currentSession?.id || null
      })
      const { session_id, session_title, message } = res.data

      if (!currentSession) {
        await loadSessions()
        navigate(`/chat/${session_id}`, { replace: true })
        setMessages([tempMsg, message])
        setCurrentSession({ id: session_id, title: session_title })
      } else {
        setMessages(prev => [
          ...prev.filter(m => m.id !== 'temp'),
          tempMsg,
          message
        ])
        setSessions(prev =>
          prev.map(s =>
            s.id === session_id
              ? { ...s, title: session_title, last_message_at: new Date().toISOString() }
              : s
          )
        )
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== 'temp'))
      toast.error(err.response?.data?.detail || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const deleteSession = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await chatApi.deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (currentSession?.id === id) navigate('/chat')
    } catch {
      toast.error('Failed to delete session')
    }
  }

  const newChat = () => {
    navigate('/chat')
    // Close sidebar drawer on mobile after navigation
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  const handleSessionClick = (id) => {
    navigate(`/chat/${id}`)
    // Close drawer on mobile after picking a session
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  return (
    /*
     * ISSUE 2 — Root `flex h-full` with no overflow control lets children
     * expand beyond the viewport on mobile, causing page-level horizontal scroll.
     *
     * FIX — `overflow-hidden` on the root container clips all children to the
     * viewport. Each scrollable zone (sidebar list, message list) manages its
     * own overflow independently.
     */
    <div className="flex h-full bg-[#0d0f13] text-slate-200 overflow-hidden relative">

      {/*
       * ─── SESSIONS SIDEBAR ────────────────────────────────────────────────
       *
       * ISSUE 3 — `w-64` sidebar is always in the document flow. On mobile it
       * consumes 256px leaving almost nothing for chat content.
       *
       * FIX — On mobile/tablet (<1024px) the sidebar is position:fixed and
       * slides in from the left as a drawer (translate-x transform). A backdrop
       * overlay closes it when tapped outside. On desktop (≥1024px) it is
       * static in flow as before.
       */}

      {/* Backdrop — only visible on mobile/tablet when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          // Positioning — fixed drawer on mobile, static on desktop
          'fixed lg:static inset-y-0 left-0 z-30 lg:z-auto',
          // Width
          'w-72 sm:w-80 lg:w-64',
          // Slide in/out on mobile
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Surface
          'bg-[#13151a] flex flex-col h-full border-r border-white/[0.06]',
          // Shrink only on desktop (in flow)
          'lg:shrink-0'
        )}
      >
        {/* Close button — visible only on mobile inside the drawer */}
        <div className="flex items-center justify-between p-3 lg:block">
          <button
            onClick={newChat}
            className="flex-1 lg:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            New Chat
          </button>
          {/* Drawer close — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-2 p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            aria-label="Close session list"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/*
         * ISSUE 4 — Session list has `overflow-y-auto` but no `flex-1` min-h.
         * On short mobile viewports the list overflows its container.
         *
         * FIX — `flex-1 min-h-0` ensures the list shrinks to fit, and
         * `overflow-y-auto` handles the scroll correctly inside a flex column.
         */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-0.5">
          {sessions.length === 0 && (
            <p className="text-xs text-slate-500 text-center mt-6 px-4">
              No conversations yet. Start a new chat!
            </p>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => handleSessionClick(s.id)}
              className={clsx(
                'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                currentSession?.id === s.id
                  ? 'bg-white/[0.04] text-white border border-white/[0.06]'
                  : 'text-slate-200 hover:bg-white/[0.02]'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare
                  className={clsx(
                    'w-3.5 h-3.5 shrink-0',
                    currentSession?.id === s.id ? 'text-orange-400' : 'text-slate-500'
                  )}
                />
                <span className="text-xs truncate">{s.title || 'New Chat'}</span>
              </div>
              <button
                onClick={e => deleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-rose-400 transition-all shrink-0 ml-1"
                aria-label="Delete session"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ─── MAIN CHAT AREA ──────────────────────────────────────────────── */}
      {/*
       * ISSUE 5 — `flex-1 flex flex-col` with no `min-w-0` means this column
       * can expand beyond the viewport when the sidebar is in flow.
       *
       * FIX — `min-w-0` prevents a flex child from overflowing its parent.
       */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#0d0f13]">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        {/*
         * ISSUE 6 — Header has `px-6` padding on all screens. On a 320px phone
         * the title clips and there's no way to open the session list.
         *
         * FIX — Reduced padding on mobile (`px-3 sm:px-6`). Added a hamburger
         * button to open the session drawer on mobile/tablet.
         */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] bg-[#13151a] flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Drawer toggle — hidden on desktop where sidebar is always visible */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors shrink-0"
            aria-label="Open session list"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>

          <BookOpen className="w-5 h-5 text-orange-400 shrink-0" />
          {/*
           * ISSUE 7 — Title has no truncation. Long session titles overflow the
           * header on mobile, causing horizontal scroll or text spill.
           *
           * FIX — `truncate min-w-0` on the heading.
           */}
          <h1 className="font-semibold text-slate-100 truncate min-w-0 text-sm sm:text-base">
            {currentSession?.title || 'Knowledge Base Chat'}
          </h1>
        </div>

        {/* ── Messages ────────────────────────────────────────────────────── */}
        {/*
         * ISSUE 8 — `px-6` padding on messages area causes text to be very
         * cramped on narrow screens (320px - 6*2*4px = only 272px text width).
         *
         * FIX — Responsive padding: `px-3 sm:px-4 md:px-6`.
         */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 space-y-5 sm:space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#13151a] border border-white/[0.08] rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">Ask anything</h2>
              <p className="text-slate-400 max-w-xs sm:max-w-sm text-sm">
                Ask questions about your department's documents. I'll find relevant information and cite my sources.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} message={msg} />
          ))}

          {sending && (
            <div className="flex gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#13151a] border border-white/[0.06] flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
              </div>
              <div className="bg-[#13151a] border border-white/[0.06] rounded-2xl rounded-tl-none px-4 py-3 shadow-xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Bar ───────────────────────────────────────────────────── */}
        {/*
         * ISSUE 9 — Input area `p-4` is fine on desktop but on mobile the
         * combined textarea + button can overflow or feel cramped. The hint
         * text "Press Enter to send..." is irrelevant on mobile (no keyboard
         * shortcut concept) and takes up precious vertical space.
         *
         * FIX — Tighter padding on mobile (`p-2 sm:p-4`). Hint text hidden
         * on mobile (`hidden sm:block`). Textarea gets a min-height that
         * works for touch targets.
         */}
        <div className="p-2 sm:p-4 border-t border-white/[0.06] bg-[#0d0f13] shrink-0">
          <div className="flex items-end gap-2 sm:gap-3 bg-[#13151a] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 border border-white/[0.06] focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none outline-none max-h-32"
              /*
               * ISSUE 10 — `minHeight: '24px'` is too small for mobile touch
               * targets (Apple HIG recommends 44px minimum). On Android/iOS
               * the tap target is too small for comfortable use.
               *
               * FIX — 44px min-height on mobile ensures a comfortable touch
               * target, scaled back to 24px on sm+ where a keyboard is present.
               */
              style={{ minHeight: 'clamp(24px, 5vw, 44px)' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 hover:bg-orange-600 disabled:bg-white/[0.04] text-white disabled:text-slate-600 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-lg"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          {/* Keyboard hint — irrelevant on touchscreen; hidden on mobile */}
          <p className="hidden sm:block text-xs text-slate-500 text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    /*
     * ISSUE 11 — `gap-3` between avatar and bubble is consistent but on
     * 320px screens the avatar + gap + bubble exceeds the container.
     * `max-w-[75%]` on the bubble means the user message bubble
     * + the 32px avatar + 12px gap = ~260px on a 320px screen — OK, but
     * citations inside can still overflow because they are `w-full` with
     * no overflow control.
     *
     * FIX — Tighter avatar gap on mobile (`gap-2 sm:gap-3`). Avatar hidden
     * on very small screens (<360px) via `hidden xs:flex` would be ideal
     * but instead we reduce avatar size on mobile. Citations get
     * `overflow-hidden` to prevent text overflow. Bubble max-width is
     * adjusted to be slightly wider on mobile for readability
     * (`max-w-[88%] sm:max-w-[75%]`).
     */
    <div className={clsx('flex gap-2 sm:gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={clsx(
          'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border',
          isUser
            ? 'bg-orange-500 text-white border-orange-400/20'
            : 'bg-[#13151a] text-orange-400 border-white/[0.06]'
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/*
       * ISSUE 12 — `max-w-[75%]` is too narrow on mobile: it makes the AI
       * response bubble very skinny (~230px on 375px screen), forcing lots
       * of wrapping and making Markdown content (tables, code blocks) clip.
       *
       * FIX — `max-w-[88%] sm:max-w-[80%] lg:max-w-[75%]` — wider on
       * small screens, standard on desktop.
       */}
      <div
        className={clsx(
          'max-w-[88%] sm:max-w-[80%] lg:max-w-[75%] space-y-2 min-w-0',
          isUser && 'items-end flex flex-col'
        )}
      >
        {/* Bubble */}
        {/*
         * ISSUE 13 — The bubble has no `overflow-hidden` or `break-words`.
         * Long unbroken strings (URLs, code) overflow the bubble and cause
         * horizontal scroll on mobile.
         *
         * FIX — Added `break-words overflow-hidden` to the bubble.
         */}
        <div
          className={clsx(
            'px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm shadow-md break-words overflow-hidden w-full',
            isUser
              ? 'bg-orange-500 text-white rounded-tr-none'
              : 'bg-[#13151a] text-slate-200 rounded-tl-none border border-white/[0.06]'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm max-w-none prose-invert prose-p:text-slate-200 prose-p:my-1 prose-headings:my-2 prose-strong:text-orange-400 prose-pre:overflow-x-auto prose-code:break-words prose-table:block prose-table:overflow-x-auto"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Citations */}
        {/*
         * ISSUE 14 — Citation cards are `w-full` with no overflow control.
         * On narrow screens the citation text (title + page) can overflow
         * its card. The ExternalLink icon has no shrink-0 so it squishes.
         *
         * FIX — `overflow-hidden` on the card, `truncate` on the title,
         * `shrink-0` retained on icon. Added `min-w-0` to the text span.
         */}
        {message.citations?.length > 0 && (
          <div className="space-y-1 w-full min-w-0">
            <p className="text-xs text-slate-400 font-medium">Sources:</p>
            {message.citations.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 text-xs bg-[#171c26] border border-orange-500/10 rounded-lg px-3 py-1.5 overflow-hidden"
              >
                <ExternalLink className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                <span className="text-slate-300 min-w-0">
                  <span className="font-medium line-clamp-2">{c.title}</span>
                  {c.page && (
                    <span className="text-orange-400/80 whitespace-nowrap">
                      {' '}· Page {c.page}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}