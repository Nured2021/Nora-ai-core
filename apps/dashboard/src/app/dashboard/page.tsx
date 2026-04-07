'use client'

import { useState, useCallback, useEffect } from 'react'
import { CommandInput } from '@/components/CommandInput'
import { LiveResults } from '@/components/LiveResults'
import { JobList } from '@/components/JobList'
import { DeployPanel } from '@/components/DeployPanel'
import { useGlobalFeed } from '@/hooks/useWebSocket'
import { getJobs } from '@/lib/api'
import { Job, WsMessage } from '@/types'
import { useAuthStore } from '@/lib/auth-store'
import { Activity, Zap, CheckCircle2, XCircle, Clock, Rocket } from 'lucide-react'

interface LogEntry {
  id: string
  message: string
  level: string
  step?: number
  created_at: string
  job_id?: string
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [deployRefresh, setDeployRefresh] = useState(0)

  useEffect(() => {
    getJobs(20).then(setJobs).catch(() => {})
  }, [])

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.type === 'job_log') {
      setLogs((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          message: msg.message || '',
          level: msg.level || 'INFO',
          step: msg.step,
          created_at: new Date().toISOString(),
          job_id: msg.job_id,
        },
      ])
    }
    if (msg.type === 'job_created' || msg.type === 'job_update') {
      getJobs(20).then(setJobs).catch(() => {})
    }
    // Phase 4: refresh deploy panel when a deployment changes
    if (msg.type === 'deploy_ready' || msg.type === 'deploy_failed' || msg.type === 'deploy_started') {
      setDeployRefresh((n) => n + 1)
      if (msg.type === 'deploy_ready' && msg.public_url) {
        setLogs((prev) => [
          ...prev,
          {
            id: `dep-${Date.now()}`,
            message: `🚀 Deployment live: ${msg.public_url}`,
            level: 'SUCCESS',
            created_at: new Date().toISOString(),
            job_id: msg.job_id,
          },
        ])
      }
    }
  }, [])

  useGlobalFeed(handleWsMessage)

  const handleCommandResult = (result: Record<string, unknown>) => {
    const logEntry: LogEntry = {
      id: `cmd-${Date.now()}`,
      message: `→ ${JSON.stringify(result)}`,
      level: result.type === 'error' ? 'ERROR' : 'INFO',
      created_at: new Date().toISOString(),
    }
    setLogs((prev) => [...prev, logEntry])
    if (result.type === 'job_created' || result.type === 'approval_required') {
      getJobs(20).then(setJobs).catch(() => {})
    }
    if (result.type === 'deploy_started') {
      setDeployRefresh((n) => n + 1)
    }
  }

  const running = jobs.filter((j) => j.status === 'running').length
  const completed = jobs.filter((j) => j.status === 'completed').length
  const failed = jobs.filter((j) => j.status === 'failed').length
  const queued = jobs.filter((j) => j.status === 'queued').length

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-nora-text">
            Welcome back, <span className="text-nora-accent">{user?.username}</span>
          </h1>
          <p className="text-sm text-nora-muted">NORA AI Phase 4 — Deployment & Public Access Active</p>
        </div>
        <div className="flex gap-3">
          <Stat icon={<Activity className="w-4 h-4 text-nora-accent" />} label="Running" value={running} color="text-nora-accent" />
          <Stat icon={<Clock className="w-4 h-4 text-nora-muted" />} label="Queued" value={queued} color="text-nora-muted" />
          <Stat icon={<CheckCircle2 className="w-4 h-4 text-nora-success" />} label="Done" value={completed} color="text-nora-success" />
          <Stat icon={<XCircle className="w-4 h-4 text-nora-error" />} label="Failed" value={failed} color="text-nora-error" />
        </div>
      </div>

      {/* Command input */}
      <CommandInput onResult={handleCommandResult} />

      {/* Live results + jobs + deployments */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Live results */}
        <div className="flex-1 min-h-0">
          <LiveResults logs={logs} showJobId />
        </div>

        {/* Right panel: jobs + deployments */}
        <div className="w-72 shrink-0 overflow-y-auto flex flex-col gap-4">
          <div>
            <div className="text-xs font-medium text-nora-muted mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" /> RECENT JOBS
            </div>
            <JobList jobs={jobs.slice(0, 10)} selectedJobId={selectedJob?.job_id} onSelect={setSelectedJob} />
          </div>

          <div>
            <div className="text-xs font-medium text-nora-muted mb-2 flex items-center gap-1">
              <Rocket className="w-3 h-3" /> DEPLOYMENTS
            </div>
            <DeployPanel refreshTrigger={deployRefresh} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5 bg-nora-surface border border-nora-border rounded-md px-3 py-2">
      {icon}
      <span className={`text-lg font-bold font-mono ${color}`}>{value}</span>
      <span className="text-xs text-nora-muted">{label}</span>
    </div>
  )
}
