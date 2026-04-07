export interface Job {
  id: number
  job_id: string
  command: string
  input_text: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'awaiting_approval'
  celery_task_id?: string
  result?: JobResult
  error?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface JobResult {
  plan?: AIPlan
  files?: AIFile[]
  files_created?: string[]
  input?: string
  // Phase 3 fields
  project_path?: string
  git_commit?: string
  preview_url?: string
  // legacy simulation fields
  tests_passed?: number
}

export interface AIPlan {
  name: string
  stack: string[]
  steps: string[]
  files: string[]
}

export interface AIFile {
  path: string
  content: string
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
  // Phase 2: AI plan/files broadcast
  plan?: AIPlan
  file_paths?: string[]
  // Phase 3: execution phase + preview
  phase?: string
  preview_url?: string
  project_path?: string
  git_commit?: string
}
