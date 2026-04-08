import axios from 'axios'
import { useAuthStore } from './auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
    || (typeof window !== 'undefined' ? localStorage.getItem('nora_token') : null)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const login = async (username: string, password: string) => {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  const res = await api.post('/api/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.data
}

export const getMe = async () => {
  const res = await api.get('/api/auth/me')
  return res.data
}

// Commands
export const sendCommand = async (inputText: string) => {
  const res = await api.post('/api/commands/', { input_text: inputText })
  return res.data
}

// Jobs
export const getJobs = async (limit = 50) => {
  const res = await api.get(`/api/jobs/?limit=${limit}`)
  return res.data
}

export const getJob = async (jobId: string) => {
  const res = await api.get(`/api/jobs/${jobId}`)
  return res.data
}

export const getJobLogs = async (jobId: string) => {
  const res = await api.get(`/api/jobs/${jobId}/logs`)
  return res.data
}

// HumanLoop
export const getPendingApprovals = async () => {
  const res = await api.get('/api/humanloop/pending')
  return res.data
}

export const decideApproval = async (
  requestId: string,
  decision: 'approved' | 'rejected' | 'modified',
  note?: string
) => {
  const res = await api.post(`/api/humanloop/${requestId}/decide`, { decision, note })
  return res.data
}

// Users
export const getUsers = async () => {
  const res = await api.get('/api/users/')
  return res.data
}

export const updateUser = async (userId: number, data: Record<string, unknown>) => {
  const res = await api.patch(`/api/users/${userId}`, data)
  return res.data
}

// Brain / Tactics
export const getBrainLayers = async () => {
  const res = await api.get('/api/brain/layers')
  return res.data
}

export const getMemories = async (layer?: number) => {
  const url = layer ? `/api/brain/memories?layer=${layer}` : '/api/brain/memories'
  const res = await api.get(url)
  return res.data
}

export const getTactics = async () => {
  const res = await api.get('/api/brain/tactics')
  return res.data
}

export const createTactic = async (data: { name: string; description: string; steps: string[] }) => {
  const res = await api.post('/api/brain/tactics', data)
  return res.data
}

export const runTactic = async (tacticId: number) => {
  const res = await api.post(`/api/brain/tactics/${tacticId}/run`)
  return res.data
}
