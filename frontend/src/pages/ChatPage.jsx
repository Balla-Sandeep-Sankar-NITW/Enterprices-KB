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
    <div className="flex h-full">
      {/* Sessions sidebar */}
      <div className="w-64 bg-gray-900 flex flex-col h-full">
        <div className="p-3">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 transition-colors"
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
                currentSession?.id === s.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs truncate">{s.title || 'New Chat'}</span>
              </div>
              <button
                onClick={e => deleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h1 className="font-semibold text-gray-900">
            {currentSession?.title || 'Knowledge Base Chat'}
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Ask anything</h2>
              <p className="text-gray-500 max-w-sm text-sm">
                Ask questions about your department's documents. I'll find relevant information and cite my sources.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} message={msg} />
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-primary-600" />
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-end gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none outline-none max-h-32"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-8 h-8 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
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
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
        isUser ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-700'
      )}>
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={clsx('max-w-[75%] space-y-2', isUser && 'items-end flex flex-col')}>
        {/* Content */}
        <div className={clsx(
          'px-4 py-3 rounded-2xl text-sm',
          isUser
            ? 'bg-primary-600 text-white rounded-tr-none'
            : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Citations */}
        {message.citations?.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium">Sources:</p>
            {message.citations.map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                <ExternalLink className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-blue-700">
                  <span className="font-medium">{c.title}</span>
                  {c.page && <span className="text-blue-400"> · Page {c.page}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
