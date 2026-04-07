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

// ─── Phase 6 ────────────────────────────────────────────────────────────────

export interface Organization {
  id: number
  name: string
  slug: string
  owner_id: number
  plan: string
  active: boolean
  created_at: string
}

export interface WorkspaceRecord {
  id: number
  name: string
  slug: string
  org_id?: number
  owner_id: number
  description?: string
  template?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface TeamMemberRecord {
  id: number
  org_id?: number
  workspace_id?: number
  user_id: number
  invited_by_id: number
  role: string
  status: string
  created_at: string
  updated_at: string
}

export interface AuditLogEntry {
  id: number
  user_id: number
  action: string
  resource_type?: string
  resource_id?: string
  details?: string
  status: string
  created_at: string
}

export interface BackupRecord {
  id: number
  backup_id: string
  triggered_by_id: number
  workspace_id?: number
  status: string
  size_mb?: number
  location?: string
  note?: string
  created_at: string
  completed_at?: string
}

export interface DeployEnvironment {
  id: number
  name: string
  env_type: string
  workspace_id?: number
  owner_id: number
  url?: string
  status: string
  promoted_from?: string
  created_at: string
  updated_at: string
}

export interface ServiceHealth {
  name: string
  status: string
  latency_ms: number
  details?: string
}

export interface SystemHealth {
  overall: string
  services: ServiceHealth[]
  orgs: number
  workspaces: number
  team_members: number
  recent_audits: number
  backups_completed: number
  checked_at: string
}

export interface AnalyticsSummary {
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  total_deployments: number
  live_deployments: number
  total_commands: number
  top_commands: { command: string; count: number }[]
  jobs_last_7d: { day: string; count: number }[]
  generated_at: string
}
