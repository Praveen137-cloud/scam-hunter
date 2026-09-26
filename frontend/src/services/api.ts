import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
})

export const getErrorMessage = (err: any, fallback: string): string => {
  const detail = err.response?.data?.detail
  if (!detail) return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
  }
  if (typeof detail === 'object') {
    return detail.message || JSON.stringify(detail)
  }
  return fallback
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: object) => api.put('/auth/me', data),
}

// Analysis
export const analysisApi = {
  analyzeText: (formData: FormData) =>
    api.post('/analysis/text', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  analyzeImage: (formData: FormData) =>
    api.post('/analysis/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  analyzeSandboxUrl: (formData: FormData) =>
    api.post('/analysis/sandbox', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: (params?: { skip?: number; limit?: number; scam_type?: string; search?: string }) =>
    api.get('/analysis/history', { params }),
  getAnalysis: (id: number) => api.get(`/analysis/${id}`),
  getDashboard: () => api.get('/analysis/dashboard'),
  deleteAnalysis: (id: number) => api.delete(`/analysis/${id}`),
  getTakedown: (id: number) => api.post(`/analysis/${id}/takedown`),
}

// Reports
export const reportApi = {
  generate: (analysisId: number) => api.post(`/reports/${analysisId}/generate`),
  download: (analysisId: number) =>
    api.get(`/reports/${analysisId}/download`, { responseType: 'blob' }),
  list: () => api.get('/reports/'),
}

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  getAnalyses: () => api.get('/admin/analyses'),
  deleteAnalysis: (id: number) => api.delete(`/admin/analyses/${id}`),
}

// Registry
export const registryApi = {
  check: (value: string) => api.get('/registry/check', { params: { value } }),
  report: (data: { value: string; type: string; scam_type: string; description?: string }) =>
    api.post('/registry/report', data),
  getRecent: () => api.get('/registry/recent'),
}
