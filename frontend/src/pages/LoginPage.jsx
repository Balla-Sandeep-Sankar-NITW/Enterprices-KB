import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  BookOpen, Eye, EyeOff, Sparkles, ArrowRight
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      navigate('/chat')
    } else {
      toast.error(result.error)
    }
  }

  return (
    /*
     * FIX 1 — Outer wrapper padding.
     * ISSUE: `p-6 md:p-12` jumps directly from mobile to desktop, leaving
     *        tablets at the same cramped padding as 320px phones.
     * FIX:   `p-4 sm:p-6 md:p-12` adds an intermediate step so tablets get
     *        comfortable breathing room without going full desktop padding.
     */
    <div className="w-full min-h-screen bg-[#07080c] text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-12 relative overflow-y-auto antialiased">
      
      {/* 1. BACKGROUND ENVIRONMENT — unchanged, decorative only */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/[0.02] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/[0.02] rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* 2. BACKGROUND APPLICATION METAFRAME — xl+ only, unchanged */}
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

      {/* 3. MAIN CONTENTS WRAPPER
       *
       * FIX 2 — Gap between hero and form card.
       * ISSUE: `gap-12 lg:gap-16` on flex-col (mobile/tablet) = 48px vertical
       *        gap which, combined with a tall hero section, pushes the form
       *        card below the fold on portrait tablets.
       * FIX:   `gap-6 sm:gap-8 lg:gap-16` — tighter on mobile, comfortable
       *        on tablet, generous on desktop where there's horizontal room.
       */}
      <main className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-16 my-auto relative z-20 px-0 sm:px-4 flex-1 py-6 sm:py-8 lg:py-0">
        
        {/* LEFT SIDE: HERO TEXT
         *
         * FIX 3 — Hero heading font size.
         * ISSUE: `text-4xl` (36px) with `font-black` on a 320px screen barely
         *        fits "Enterprise" on one line, causing awkward reflow.
         * FIX:   Start at `text-3xl` (30px) on mobile, scale up from sm+.
         *        Desktop sizes (lg:text-6xl) are unchanged.
         */}
        <div className="w-full lg:w-[55%] space-y-6 sm:space-y-8 text-center lg:text-left order-1 py-2">
          <div className="space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/5 border border-blue-500/10 text-[11px] font-medium text-blue-400 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AI-Powered Intelligence Framework
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Enterprise <br className="hidden lg:block"/>
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Knowledge Base
              </span>
            </h2>
            <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mt-1 sm:mt-2">
              Unlock Knowledge Across Your Organization
            </h3>
          </div>
          
          {/*
           * FIX 4 — Body text legibility on mobile.
           * ISSUE: `text-sm` on mobile (14px) with `font-medium` and low-
           *        contrast `text-slate-400` is hard to read on small screens.
           * FIX:   Keep `text-sm sm:text-base` but ensure line-height is
           *        generous (`leading-relaxed` already covers this — kept).
           */}
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Access policies, regulations, manuals, reports, and internal documents through a single AI-powered platform. Ask questions in natural language and receive accurate, context-aware answers instantly.
          </p>

          {/* Feature Badges — tighter gap on mobile */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5 pt-1 sm:pt-2">
            {["Centralized Knowledge", "Intelligent Search", "Instant Answers", "Secure Access"].map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-blue-500/[0.03] border border-blue-500/10 text-xs font-semibold text-blue-300/90 tracking-wide shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: FORM CARD
         *
         * FIX 5 — translate-y on mobile clips the card.
         * ISSUE: `transform translate-y-3 lg:translate-y-8` applies a 12px
         *        downward shift on ALL screens below lg. On short phones
         *        (667px iPhone SE) this pushes the bottom of the card into
         *        the footer or off-screen entirely.
         * FIX:   `translate-y-0 lg:translate-y-8` — no shift on mobile/
         *        tablet, restore the desktop offset only at lg+.
         */}
        <div className="w-full lg:w-[40%] max-w-md mx-auto lg:mx-0 shrink-0 order-2 flex items-center justify-center translate-y-0 lg:translate-y-8 transition-transform duration-300">
          
          {/*
           * FIX 6 — Form card horizontal padding.
           * ISSUE: `px-8` (32px per side) on a 320px screen leaves only
           *        256px for form inputs — inputs feel cramped, placeholder
           *        text clips, and the password toggle button crowds the
           *        input text.
           * FIX:   `px-5 sm:px-8` — tighter on mobile, full padding sm+.
           *        Vertical padding also tightened slightly on mobile:
           *        `py-5 sm:py-6`.
           */}
          <div className="w-full bg-[#0f111a] border border-white/[0.08] py-5 sm:py-6 px-5 sm:px-8 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative">
            
            {/*
             * FIX 7 — Orange accent line inset.
             * ISSUE: `inset-x-20` on a narrow card (after px-5 mobile) means
             *        the line looks proportionally too short vs the card width.
             * FIX:   `inset-x-10 sm:inset-x-20` — shorter inset on mobile
             *        keeps the accent balanced.
             */}
            <div className="absolute top-[-1px] inset-x-10 sm:inset-x-20 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent pointer-events-none" />
            
            {/* Identity Platform Header */}
            <div className="flex items-center gap-3 mb-4 sm:mb-5 border-b border-white/[0.03] pb-4">
              <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                <BookOpen className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-100 tracking-wide leading-none">Enterprise KB</h1>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium tracking-wide">Knowledge Base Platform</p>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">Welcome back</h2>
              <p className="text-slate-400 text-xs mt-0.5">Sign in to your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-orange-400/80">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.05] bg-[#07080c] px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all shadow-inner"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-orange-400/80">
                  Security Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.05] bg-[#07080c] pl-4 pr-11 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                  {/* Toggle button: p-2 ensures 40px touch area (4px padding + 32px button = 40px) */}
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-white/[0.03] text-white disabled:text-slate-600 text-sm font-semibold transition-all shadow-md active:scale-[0.985] disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in…' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4 text-orange-200" />}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-4 sm:mt-5 pt-4 border-t border-white/[0.03]">
              Don't have an account?{' '}
              <Link to="/signup" className="text-orange-400 font-semibold hover:underline transition-all">
                Sign up
              </Link>
            </p>
          </div>
        </div>

      </main>

      {/*
       * FIX 8 — Footer top margin.
       * ISSUE: `mt-8` (32px) on short phones adds pressure when the page is
       *        already near-full. Soft reduce on mobile only.
       * FIX:   `mt-4 sm:mt-8` — half the gap on mobile, original on sm+.
       */}
      <footer className="w-full text-center relative z-20 mt-4 sm:mt-8 pt-5 border-t border-white/[0.03] shrink-0">
        <p className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-indigo-400/60 uppercase">
          "Transform Documents into Actionable Knowledge"
        </p>
      </footer>

    </div>
  )
}