export interface Job {
  id: number
  job_id: string
  command: string
  input_text: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'awaiting_approval'
  celery_task_id?: string
  result?: Record<string, unknown>
  error?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface JobLog {
  id: number
  job_id: string
  level: string
  message: string
  step?: number
  created_at: string
}

export interface ApprovalRequest {
  id: number
  request_id: string
  job_id?: string
  requested_by_id: number
  action: string
  details: string
  status: 'pending' | 'approved' | 'rejected' | 'modified'
  decision_by_id?: number
  decision_note?: string
  created_at: string
  decided_at?: string
  expires_at?: string
}

export interface User {
  id: number
  username: string
  email: string
  role: string
  workspace: string
  is_active: boolean
  created_at: string
}

export interface Tactic {
  id: number
  name: string
  description: string
  steps: string[]
  created_by_id: number
  run_count: number
  created_at: string
  updated_at: string
}

export interface BrainLayer {
  layer: number
  name: string
  description: string
  memory_count: number
}

export interface BrainMemory {
  id: number
  user_id: number
  layer: number
  layer_name: string
  key: string
  value: string
  created_at: string
}

export interface WsMessage {
  type: string
  job_id?: string
  status?: string
  message?: string
  level?: string
  step?: number
  request_id?: string
  action?: string
  details?: string
}
