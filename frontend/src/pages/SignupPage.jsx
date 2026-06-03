import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { authApi } from '@/api/client'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', full_name: '', password: '', department_id: '' })
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Load departments for selection (using a public endpoint)
    fetch('/api/v1/users/departments', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` }
    })
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setDepartments(data) : null)
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.signup({
        ...form,
        department_id: form.department_id ? parseInt(form.department_id) : null
      })
      toast.success('Registration successful! Please check your email to verify.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#07080c] text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-y-auto antialiased">
      
      {/* 1. BACKGROUND ENVIRONMENT (Ambient Lighting & Grids) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/[0.02] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/[0.02] rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* 2. BACKGROUND APPLICATION METAFRAME */}
      <div className="absolute inset-x-6 md:inset-x-16 top-44 bottom-28 rounded-3xl border border-white/[0.03] bg-[#0b0c10]/40 pointer-events-none z-10 overflow-hidden hidden xl:block select-none">
        <div className="w-full h-full p-8 flex flex-col gap-8 opacity-[0.12] filter blur-[3px]">
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800" />
              <div className="h-4 w-36 bg-slate-800 rounded-md" />
            </div>
            <div className="h-8 w-24 bg-slate-800 rounded-lg" />
          </div>
          <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
            <div className="col-span-8 flex flex-col gap-6">
              <div className="bg-[#12141c] border border-white/[0.05] rounded-2xl p-5">
                <div className="h-12 bg-slate-900 rounded-xl" />
              </div>
              <div className="bg-[#12141c] border border-white/[0.05] rounded-2xl p-5 flex-1">
                <div className="h-full bg-slate-900 rounded-xl" />
              </div>
            </div>
            <div className="col-span-4 bg-[#12141c] border border-white/[0.05] rounded-2xl p-5 space-y-4">
              <div className="h-4 w-28 bg-slate-800 rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-slate-900/60 rounded-xl border border-white/[0.02]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENTS WRAPPER */}
      <main className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 my-auto relative z-20 px-4 flex-1">
        
        {/* LEFT SIDE: EXPANDED TEXT HERO SEGMENT */}
        <div className="w-full lg:w-[55%] space-y-8 text-center lg:text-left order-1 py-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/5 border border-blue-500/10 text-[11px] font-medium text-blue-400 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AI-Powered Intelligence Framework
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Enterprise <br className="hidden lg:block"/>
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Knowledge Base</span>
            </h2>
            <h3 className="text-sm sm:text-base font-bold text-slate-400 tracking-widest uppercase mt-2">
              Unlock Knowledge Across Your Organization
            </h3>
          </div>
          
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Access policies, regulations, manuals, reports, and internal documents through a single AI-powered platform. Ask questions in natural language and receive accurate, context-aware answers instantly.
          </p>

          {/* Feature Badges Wrapper */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2">
            {["Centralized Knowledge", "Intelligent Search", "Instant Answers", "Secure Access"].map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/[0.03] border border-blue-500/10 text-xs font-semibold text-blue-300/90 tracking-wide shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: SIGN UP CONTAINER PLATFORM (Now unified with the Orange Brand theme) */}
        <div className="w-full lg:w-[40%] max-w-md shrink-0 order-2 flex items-center justify-center transform translate-y-4 lg:translate-y-8 transition-transform duration-300">
          <div className="w-full bg-[#0f111a] border border-white/[0.08] py-6 px-8 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative">
            
            {/* Ambient Orange Accented Top Line */}
            <div className="absolute top-[-1px] inset-x-20 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent pointer-events-none" />
            
            {/* Identity Platform Header */}
            <div className="flex items-center gap-3 mb-5 border-b border-white/[0.03] pb-4">
              <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center shadow-inner">
                <BookOpen className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-100 tracking-wide leading-none">Enterprise KB</h1>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium tracking-wide">Knowledge Base Platform</p>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">Create account</h2>
              <p className="text-slate-400 text-xs mt-0.5">Register for access to the knowledge base</p>
            </div>

            {/* Native Form Controls Integration */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-orange-400/80">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.05] bg-[#07080c] px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all shadow-inner"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-orange-400/80">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.05] bg-[#07080c] px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all shadow-inner"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-orange-400/80">Security Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.05] bg-[#07080c] px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all shadow-inner"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  required
                />
              </div>

              {departments.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-orange-400/80">Department (optional)</label>
                  <div className="relative">
                    <select
                      value={form.department_id}
                      onChange={e => setForm({ ...form, department_id: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.05] bg-[#07080c] px-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all shadow-inner appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#0f111a]">Select department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id} className="bg-[#0f111a]">{d.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full mt-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-white/[0.03] text-white disabled:text-slate-600 text-sm font-semibold transition-all shadow-md active:scale-[0.985] disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4 text-orange-200" />}
              </button>
            </form>

            {/* Secondary Form Redirect links */}
            <p className="text-center text-xs text-slate-400 mt-5 pt-4 border-t border-white/[0.03]">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-400 font-semibold hover:underline transition-all">
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </main>

      {/* 4. BASE BRAND TAGLINE RUNTIME */}
      <footer className="w-full text-center relative z-20 mt-8 pt-5 border-t border-white/[0.03] shrink-0">
        <p className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-indigo-400/60 uppercase">
          "Transform Documents into Actionable Knowledge"
        </p>
      </footer>

    </div>
  )
}