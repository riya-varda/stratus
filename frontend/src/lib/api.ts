import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const { access_token, refresh_token } = response.data
          useAuthStore.getState().setTokens(access_token, refresh_token)
          if (originalRequest?.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`
          }
          return apiClient(originalRequest!)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    apiClient.post('/auth/register', data),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  refresh: (refresh_token: string) =>
    apiClient.post('/auth/refresh', { refresh_token }),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  verifyEmail: (token: string) => apiClient.post('/auth/verify-email', { token }),
}

// Users
export const usersApi = {
  getProfile: () => apiClient.get('/users/me'),
  updateProfile: (data: { full_name?: string; bio?: string; avatar_url?: string }) =>
    apiClient.patch('/users/me', data),
  changePassword: (current_password: string, new_password: string) =>
    apiClient.post('/users/me/change-password', { current_password, new_password }),
  listApiKeys: () => apiClient.get('/users/me/api-keys'),
  createApiKey: (name: string) => apiClient.post('/users/me/api-keys', { name }),
  deleteApiKey: (id: string) => apiClient.delete(`/users/me/api-keys/${id}`),
}

// Projects
export const projectsApi = {
  list: (params?: {
    page?: number
    page_size?: number
    search?: string
    sort_by?: string
    sort_order?: string
    status?: string
  }) => apiClient.get('/projects/', { params }),
  get: (id: string) => apiClient.get(`/projects/${id}`),
  create: (data: {
    name: string
    description?: string
    repository_url?: string
    framework?: string
  }) => apiClient.post('/projects/', data),
  update: (id: string, data: Partial<{ name: string; description: string; status: string }>) =>
    apiClient.patch(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
}

// Deployments
export const deploymentsApi = {
  list: (
    projectId: string,
    params?: {
      page?: number
      page_size?: number
      environment?: string
      status?: string
      search?: string
    }
  ) => apiClient.get(`/projects/${projectId}/deployments`, { params }),
  get: (projectId: string, deploymentId: string) =>
    apiClient.get(`/projects/${projectId}/deployments/${deploymentId}`),
  create: (
    projectId: string,
    data: {
      environment?: string
      commit_sha?: string
      commit_message?: string
      branch?: string
    }
  ) => apiClient.post(`/projects/${projectId}/deployments`, data),
  cancel: (projectId: string, deploymentId: string) =>
    apiClient.post(`/projects/${projectId}/deployments/${deploymentId}/cancel`),
  stats: (projectId: string) => apiClient.get(`/projects/${projectId}/deployments/stats`),
}

// Analytics
export const analyticsApi = {
  overview: () => apiClient.get('/analytics/overview'),
}

// Health
export const healthApi = {
  check: () => apiClient.get('/health'),
}
