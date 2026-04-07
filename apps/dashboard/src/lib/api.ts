import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nora_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('nora_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = async (username: string, password: string) => {
  const form = new FormData()
  form.append('username', username)
  form.append('password', password)
  const res = await api.post('/api/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.data as { access_token: string; token_type: string }
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

// Deployments (Phase 4)
export const getDeployments = async (limit = 50) => {
  const res = await api.get(`/api/deployments/?limit=${limit}`)
  return res.data
}

export const getDeployment = async (deploymentId: string) => {
  const res = await api.get(`/api/deployments/${deploymentId}`)
  return res.data
}

export const publishDeployment = async (jobId: string) => {
  const res = await api.post('/api/deployments/', { job_id: jobId })
  return res.data
}

// ─── Phase 5 — AI Modules ───────────────────────────────────────────────────

export const getAllModules = async (phase5Only = false) => {
  const res = await api.get(`/api/phase5/modules${phase5Only ? '?phase5_only=true' : ''}`)
  return res.data
}

// ─── Phase 5 — System Status / Consciousness ────────────────────────────────

export const getSystemStatus = async () => {
  const res = await api.get('/api/phase5/status')
  return res.data
}

// ─── Phase 5 — God Mode ─────────────────────────────────────────────────────

export const getGodModeState = async () => {
  const res = await api.get('/api/phase5/god-mode')
  return res.data
}

export const toggleGodMode = async () => {
  const res = await api.post('/api/phase5/god-mode/toggle')
  return res.data
}

export const setGodModeOn = async () => {
  const res = await api.post('/api/phase5/god-mode/on')
  return res.data
}

export const setGodModeOff = async () => {
  const res = await api.post('/api/phase5/god-mode/off')
  return res.data
}

// ─── Phase 5 — Personality ──────────────────────────────────────────────────

export const getPersonality = async () => {
  const res = await api.get('/api/phase5/personality')
  return res.data
}

export const setPersonalityTrait = async (trait: string, value: string) => {
  const res = await api.post('/api/phase5/personality', { trait, value })
  return res.data
}

// ─── Phase 5 — Global Network ───────────────────────────────────────────────

export const getGlobalNetwork = async () => {
  const res = await api.get('/api/phase5/global-network')
  return res.data
}

// ─── Phase 5 — Evolved Modules ──────────────────────────────────────────────

export const getEvolvedModules = async () => {
  const res = await api.get('/api/phase5/evolved-modules')
  return res.data
}

// ─── Phase 5 — Memory Search ────────────────────────────────────────────────

export const searchMemory = async (query: string) => {
  const res = await api.post(`/api/phase5/memory/search?query=${encodeURIComponent(query)}`)
  return res.data
}

// ─── Phase 6 — Organizations ────────────────────────────────────────────────

export const getOrganizations = async () => {
  const res = await api.get('/api/phase6/organizations')
  return res.data
}

export const createOrganization = async (name: string, slug: string, plan = 'free') => {
  const res = await api.post('/api/phase6/organizations', { name, slug, plan })
  return res.data
}

// ─── Phase 6 — Workspaces ───────────────────────────────────────────────────

export const getWorkspaces = async () => {
  const res = await api.get('/api/phase6/workspaces')
  return res.data
}

export const createWorkspace = async (name: string, slug: string, description?: string, template?: string, org_id?: number) => {
  const res = await api.post('/api/phase6/workspaces', { name, slug, description, template, org_id })
  return res.data
}

// ─── Phase 6 — Team ─────────────────────────────────────────────────────────

export const getTeamMembers = async (org_id?: number, workspace_id?: number) => {
  const params = new URLSearchParams()
  if (org_id) params.set('org_id', String(org_id))
  if (workspace_id) params.set('workspace_id', String(workspace_id))
  const res = await api.get(`/api/phase6/team?${params.toString()}`)
  return res.data
}

export const inviteTeamMember = async (username: string, role = 'VIEWER', org_id?: number, workspace_id?: number) => {
  const res = await api.post('/api/phase6/team/invite', { username, role, org_id, workspace_id })
  return res.data
}

// ─── Phase 6 — Audit Log ────────────────────────────────────────────────────

export const getAuditLog = async (limit = 100) => {
  const res = await api.get(`/api/phase6/audit-log?limit=${limit}`)
  return res.data
}

// ─── Phase 6 — Backups ──────────────────────────────────────────────────────

export const getBackups = async () => {
  const res = await api.get('/api/phase6/backups')
  return res.data
}

export const runBackup = async (note?: string) => {
  const params = note ? `?note=${encodeURIComponent(note)}` : ''
  const res = await api.post(`/api/phase6/backups/run${params}`)
  return res.data
}

export const restoreLatestBackup = async () => {
  const res = await api.post('/api/phase6/backups/restore')
  return res.data
}

// ─── Phase 6 — Environments ─────────────────────────────────────────────────

export const getEnvironments = async () => {
  const res = await api.get('/api/phase6/environments')
  return res.data
}

export const createEnvironment = async (name: string, env_type = 'staging', workspace_id?: number) => {
  const params = new URLSearchParams({ name, env_type })
  if (workspace_id) params.set('workspace_id', String(workspace_id))
  const res = await api.post(`/api/phase6/environments?${params.toString()}`)
  return res.data
}

export const promoteEnvironment = async (envId: number, target = 'production', note?: string) => {
  const res = await api.post(`/api/phase6/environments/${envId}/promote`, { environment_id: envId, target, note })
  return res.data
}

// ─── Phase 6 — Health ───────────────────────────────────────────────────────

export const getSystemHealth = async () => {
  const res = await api.get('/api/phase6/health')
  return res.data
}

// ─── Phase 6 — Analytics ────────────────────────────────────────────────────

export const getAnalytics = async () => {
  const res = await api.get('/api/phase6/analytics')
  return res.data
}
