import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PendingApprovalPage() {
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
