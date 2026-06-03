import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Clock, BookOpen } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
        </div>

        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Verifying your email...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-500">Your account is now pending admin approval. You'll receive an email when approved.</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting to login...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-500">{message}</p>
            <Link to="/login" className="btn-primary inline-block mt-4">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  )
}

export function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pending Approval</h2>
        <p className="text-gray-500 mb-4">
          Your account is pending admin approval. You'll receive an email notification once approved.
        </p>
        <Link to="/login" className="text-primary-600 text-sm font-medium hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  )
}

export default VerifyEmailPage
