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
  // Phase 4: deployments
  deployment_id?: string
  name?: string
  public_url?: string
  error?: string
}

export interface Deployment {
  id: number
  deployment_id: string
  job_id: string
  user_id: number
  name: string
  stack?: string
  status: 'pending' | 'deploying' | 'live' | 'failed'
  public_url?: string
  project_path?: string
  files_count: number
  error?: string
  created_at: string
  updated_at?: string
}

// ─── Phase 5 ────────────────────────────────────────────────────────────────

export interface Phase5Module {
  number: number
  name: string
  description: string
  phase: number
  active: boolean
}

export interface PersonalityTrait {
  id: number
  user_id: number
  trait: string
  value: string
  updated_at: string
}

export interface GodModeState {
  user_id: number
  active: boolean
  activated_at?: string
  updated_at: string
}

export interface SystemStatus {
  god_mode_active: boolean
  active_modules: number
  total_modules: number
  brain_layers: number
  evolved_modules: number
  dream_mode: string
  global_network: string
  personality_traits: number
  consciousness_level: string
}

export interface NetworkNode {
  id: string
  region: string
  status: string
  latency_ms: number
}

export interface GlobalNetwork {
  status: string
  nodes: NetworkNode[]
  last_sync?: string
  message: string
}

export interface EvolvedModule {
  id: number
  name: string
  description: string
  capabilities: string
  created_by_id: number
  active: boolean
  created_at: string
}

export interface MemorySearchResult {
  id: number
  user_id: number
  layer: number
  layer_name: string
  key: string
  value: string
  created_at: string
}
