import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Clock, BookOpen, ArrowRight } from 'lucide-react'
import { authApi } from '@/api/client'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    authApi.verifyEmail(token)
      .then(() => {
        setStatus('success')
        setTimeout(() => navigate('/login'), 3000)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'Verification failed')
      })
  }, [])

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
      <main className="w-full max-w-md mx-auto my-auto relative z-20 px-4 flex-1 flex items-center justify-center transform translate-y-4 lg:translate-y-8 transition-transform duration-300">
        
        <div className="w-full bg-[#0f111a] border border-white/[0.08] py-8 px-8 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative text-center">
          
          {/* Ambient Orange Accented Top Line */}
          <div className="absolute top-[-1px] inset-x-16 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent pointer-events-none" />
          
          {/* Platform Identity Minimal Header */}
          <div className="flex items-center gap-3 justify-center mb-8 border-b border-white/[0.03] pb-5">
            <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center shadow-inner">
              <BookOpen className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-bold text-slate-100 tracking-wide leading-none">Enterprise KB</h1>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium tracking-wide">Email Verification Framework</p>
            </div>
          </div>

          {/* STATUS SYSTEM RENDERING */}
          {status === 'loading' && (
            <div className="py-4">
              <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center shadow-inner mx-auto mb-6">
                <Loader className="w-7 h-7 text-orange-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight mb-2">Verifying your email...</h2>
              <p className="text-slate-400 text-xs font-medium">Communicating with knowledge base directory node.</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-inner mx-auto mb-6">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mb-3">Email Verified!</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-6 font-medium">
                Your account is now pending admin approval. You'll receive an email notification when activated.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] text-[11px] text-orange-400/80 font-mono tracking-wide">
                <Loader className="w-3 h-3 animate-spin text-orange-400" />
                Redirecting to account gate...
              </div>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center shadow-inner mx-auto mb-6">
                <XCircle className="w-7 h-7 text-rose-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mb-3">Verification Failed</h2>
              <p className="text-rose-400/90 bg-rose-500/[0.03] border border-rose-500/10 py-2 px-4 rounded-xl text-xs sm:text-sm max-w-sm mx-auto mb-8 font-medium">
                {message}
              </p>
              
              <div className="border-t border-white/[0.03] pt-5">
                <Link 
                  to="/login" 
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all shadow-md active:scale-[0.985] flex items-center justify-center gap-2"
                >
                  Back to Login
                  <ArrowRight className="w-4 h-4 text-orange-200" />
                </Link>
              </div>
            </div>
          )}

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

export function PendingApprovalPage() {
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
      <main className="w-full max-w-md mx-auto my-auto relative z-20 px-4 flex-1 flex items-center justify-center transform translate-y-4 lg:translate-y-8 transition-transform duration-300">
        
        <div className="w-full bg-[#0f111a] border border-white/[0.08] py-8 px-8 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative text-center">
          
          {/* Ambient Orange Accented Top Line */}
          <div className="absolute top-[-1px] inset-x-16 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent pointer-events-none" />
          
          {/* Status Icon Wrapper */}
          <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center shadow-inner mx-auto mb-6">
            <Clock className="w-7 h-7 text-orange-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mb-3">
            Pending Approval
          </h2>
          
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-8 font-medium">
            Your account has been securely registered and is currently pending admin verification. 
            You will receive an email notification once your permissions are activated.
          </p>

          {/* Clean Action Separation split line */}
          <div className="border-t border-white/[0.03] pt-5">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-orange-400 font-semibold hover:text-orange-300 hover:underline transition-all group"
            >
              Back to Login
              <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
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

export default VerifyEmailPage