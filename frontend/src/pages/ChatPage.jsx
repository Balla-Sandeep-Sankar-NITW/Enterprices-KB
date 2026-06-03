import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Plus, Trash2, MessageSquare, BookOpen, ExternalLink } from 'lucide-react'
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
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

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

    // Optimistic user message
    const tempMsg = { id: 'temp', role: 'user', content: question, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])

    try {
      const res = await chatApi.sendMessage({
        content: question,
        session_id: currentSession?.id || null
      })

      const { session_id, session_title, message } = res.data

      // Navigate to session if new
      if (!currentSession) {
        await loadSessions()
        navigate(`/chat/${session_id}`, { replace: true })
        setMessages([tempMsg, message])
        setCurrentSession({ id: session_id, title: session_title })
      } else {
        setMessages(prev => [...prev.filter(m => m.id !== 'temp'), tempMsg, message])
        // Update session title in sidebar
        setSessions(prev => prev.map(s =>
          s.id === session_id ? { ...s, title: session_title, last_message_at: new Date().toISOString() } : s
        ))
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

  const newChat = () => navigate('/chat')

  return (
    <div className="flex h-full bg-[#0d0f13] text-slate-200">
      {/* Sessions sidebar */}
      <div className="w-64 bg-[#13151a] flex flex-col h-full border-r border-white/[0.06]">
        <div className="p-3">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => navigate(`/chat/${s.id}`)}
              className={clsx(
                'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                currentSession?.id === s.id ? 'bg-white/[0.04] text-white border border-white/[0.06]' : 'text-slate-200 hover:bg-white/[0.02]'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className={clsx('w-3.5 h-3.5 shrink-0', currentSession?.id === s.id ? 'text-orange-400' : 'text-slate-300')} />
                <span className="text-xs truncate">{s.title || 'New Chat'}</span>
              </div>
              <button
                onClick={e => deleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-rose-400 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[#0d0f13]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-[#13151a] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange-400" />
          <h1 className="font-semibold text-slate-100">
            {currentSession?.title || 'Knowledge Base Chat'}
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-[#13151a] border border-white/[0.08] rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                <BookOpen className="w-8 h-8 text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">Ask anything</h2>
              <p className="text-slate-200 max-w-sm text-sm">
                Ask questions about your department's documents. I'll find relevant information and cite my sources.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} message={msg} />
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#13151a] border border-white/[0.06] flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-orange-400" />
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

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06] bg-[#0d0f13]">
          <div className="flex items-end gap-3 bg-[#13151a] rounded-2xl px-4 py-3 border border-white/[0.06] focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 resize-none outline-none max-h-32"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:bg-white/[0.04] text-white disabled:text-slate-600 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={clsx('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border',
        isUser ? 'bg-orange-500 text-white border-orange-400/20' : 'bg-[#13151a] text-orange-400 border-white/[0.06]'
      )}>
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={clsx('max-w-[75%] space-y-2', isUser && 'items-end flex flex-col')}>
        {/* Content */}
        <div className={clsx(
          'px-4 py-3 rounded-2xl text-sm shadow-md',
          isUser
            ? 'bg-orange-500 text-white rounded-tr-none'
            : 'bg-[#13151a] text-slate-200 rounded-tl-none border border-white/[0.06]'
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm max-w-none prose-invert prose-p:text-slate-200 prose-p:my-1 prose-headings:my-2 prose-strong:text-orange-400"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Citations */}
        {message.citations?.length > 0 && (
          <div className="space-y-1 w-full">
            <p className="text-xs text-slate-300 font-medium">Sources:</p>
            {message.citations.map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs bg-[#171c26] border border-orange-500/10 rounded-lg px-3 py-1.5">
                <ExternalLink className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">
                  <span className="font-medium">{c.title}</span>
                  {c.page && <span className="text-orange-400/80"> · Page {c.page}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}