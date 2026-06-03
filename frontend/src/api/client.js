import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken })
          localStorage.setItem('access_token', res.data.access_token)
          localStorage.setItem('refresh_token', res.data.refresh_token)
          original.headers.Authorization = `Bearer ${res.data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ─────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  refresh: (token) => api.post('/auth/refresh', { refresh_token: token }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// ─────────────────────────────────────────
// Admin API
// ─────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  pendingUsers: () => api.get('/admin/users/pending'),
  approveUser: (id, data) => api.post(`/admin/users/${id}/approve`, data),
  rejectUser: (id, data) => api.post(`/admin/users/${id}/reject`, data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  departments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  deptChangeRequests: (status) => api.get('/admin/dept-change-requests', { params: { status } }),
  reviewDeptChange: (id, data) => api.post(`/admin/dept-change-requests/${id}/review`, data),
}

// ─────────────────────────────────────────
// Documents API
// ─────────────────────────────────────────
export const documentsApi = {
  list: (params) => api.get('/documents/', { params }),
  get: (id) => api.get(`/documents/${id}`),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  reprocess: (id) => api.post(`/documents/${id}/reprocess`),
}

// ─────────────────────────────────────────
// Chat API
// ─────────────────────────────────────────
export const chatApi = {
  sendMessage: (data) => api.post('/chat/message', data),
  sessions: () => api.get('/chat/sessions'),
  getSession: (id) => api.get(`/chat/sessions/${id}`),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
  archiveSession: (id) => api.patch(`/chat/sessions/${id}/archive`),
  renameSession: (id, title) => api.patch(`/chat/sessions/${id}/rename`, null, { params: { title } }),
}

// ─────────────────────────────────────────
// Users API
// ─────────────────────────────────────────
export const usersApi = {
  updateProfile: (data) => api.put('/users/me', data),
  departments: () => api.get('/users/departments'),
  requestDeptChange: (data) => api.post('/users/department-change-request', data),
  myDeptRequests: () => api.get('/users/department-change-requests/my'),
}