'use client'

import { useMemo } from 'react'
import { Job } from '@/types'
import clsx from 'clsx'
import {
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  FileCode,
  ListOrdered,
  Terminal,
  Activity,
} from 'lucide-react'

interface LogEntry {
  id: string
  message: string
  level: string
  step?: number
  created_at: string
  job_id?: string
}

interface Props {
  logs: LogEntry[]
  jobs: Job[]
  activeJobId?: string | null
}

const FILE_PATTERNS = ['created ', 'writing ', '→ created', 'create ', 'generated ', 'wrote ']

function isFileLog(msg: string): boolean {
  const lower = msg.toLowerCase()
  return FILE_PATTERNS.some((p) => lower.includes(p))
}

export function BuildEnginePanel({ logs, jobs, activeJobId }: Props) {
  const activeJob = useMemo(() => {
    if (activeJobId) return jobs.find((j) => j.job_id === activeJobId) ?? null
    return jobs.find((j) => j.status === 'running') ?? jobs[0] ?? null
  }, [jobs, activeJobId])

  const jobLogs = useMemo(
    () => (activeJob ? logs.filter((l) => !l.job_id || l.job_id === activeJob.job_id) : logs),
    [logs, activeJob]
  )

  const status: string = activeJob?.status ?? 'idle'

  const currentStep = useMemo(() => {
    const stepped = jobLogs.filter((l) => l.step != null)
    return stepped.length > 0 ? stepped[stepped.length - 1].step : null
  }, [jobLogs])

  const latestTask = useMemo(() => {
    const last = jobLogs[jobLogs.length - 1]
    return last?.message ?? null
  }, [jobLogs])

  const filesCreated = useMemo(
    () => jobLogs.filter((l) => isFileLog(l.message)).slice(-12),
    [jobLogs]
  )

  const recentLogs = jobLogs.slice(-25)

  const { color: statusColor, label: statusLabel } = useMemo(() => {
    const map: Record<string, { color: string; label: string }> = {
      running:           { color: 'text-nora-accent',   label: 'RUNNING' },
      completed:         { color: 'text-nora-success',  label: 'COMPLETED' },
      failed:            { color: 'text-nora-error',    label: 'FAILED' },
      queued:            { color: 'text-nora-muted',    label: 'QUEUED' },
      idle:              { color: 'text-nora-muted',    label: 'IDLE' },
      awaiting_approval: { color: 'text-nora-warning',  label: 'AWAITING APPROVAL' },
      cancelled:         { color: 'text-nora-muted',    label: 'CANCELLED' },
    }
    return map[status] ?? { color: 'text-nora-muted', label: 'IDLE' }
  }, [status])

  return (
    <div className="flex flex-col bg-nora-surface border border-nora-border rounded-lg w-60 shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-nora-border shrink-0">
        <div className="w-5 h-5 rounded bg-nora-accent flex items-center justify-center shrink-0">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-nora-accent tracking-wide">BUILD ENGINE</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Phase */}
        <Section icon={<Activity className="w-3 h-3 text-nora-accent" />} title="PHASE">
          <div className="font-mono text-nora-text text-xs">Phase 1 — Core System</div>
          <div className="text-nora-muted text-xs mt-0.5">10 AI Modules · 10 Brain Layers</div>
        </Section>

        {/* Status */}
        <Section icon={<Circle className="w-3 h-3 text-nora-muted" />} title="STATUS">
          <div className={clsx('font-mono font-bold text-xs flex items-center gap-1.5', statusColor)}>
            {status === 'running'           && <Circle className="w-2.5 h-2.5 animate-pulse" />}
            {status === 'completed'         && <CheckCircle2 className="w-2.5 h-2.5" />}
            {status === 'failed'            && <XCircle className="w-2.5 h-2.5" />}
            {(status === 'queued' || status === 'idle') && <Clock className="w-2.5 h-2.5" />}
            {status === 'awaiting_approval' && <AlertTriangle className="w-2.5 h-2.5" />}
            {statusLabel}
          </div>
          {activeJob && (
            <div className="text-nora-muted text-xs truncate mt-0.5 font-mono">
              {activeJob.job_id}
            </div>
          )}
        </Section>

        {/* Step */}
        {currentStep != null && (
          <Section icon={<ListOrdered className="w-3 h-3 text-nora-muted" />} title="STEP">
            <div className="font-mono text-nora-text text-xs">Step #{currentStep}</div>
          </Section>
        )}

        {/* Active task */}
        {latestTask && (
          <Section icon={<Terminal className="w-3 h-3 text-nora-muted" />} title="ACTIVE TASK">
            <div className="font-mono text-nora-text text-xs break-all leading-relaxed">
              {latestTask}
            </div>
          </Section>
        )}

        {/* Files created */}
        {filesCreated.length > 0 && (
          <Section icon={<FileCode className="w-3 h-3 text-nora-muted" />} title={`FILES (${filesCreated.length})`}>
            <div className="space-y-0.5">
              {filesCreated.map((f) => (
                <div key={f.id} className="font-mono text-nora-success text-xs truncate">
                  {f.message}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Live log */}
        <Section icon={<Terminal className="w-3 h-3 text-nora-muted" />} title="LIVE LOG">
          <div className="space-y-0.5 font-mono">
            {recentLogs.length === 0 ? (
              <div className="text-nora-muted italic text-xs">Waiting for output…</div>
            ) : (
              recentLogs.map((l) => (
                <div
                  key={l.id}
                  className={clsx('text-xs truncate leading-relaxed', {
                    'text-nora-error':   l.level === 'ERROR',
                    'text-nora-warning': l.level === 'WARNING',
                    'text-nora-success': l.level === 'SUCCESS',
                    'text-nora-text':    !['ERROR', 'WARNING', 'SUCCESS'].includes(l.level),
                  })}
                >
                  {l.message}
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-nora-muted mb-1">
        {icon}
        <span className="text-xs font-semibold tracking-wider">{title}</span>
      </div>
      <div className="pl-4">{children}</div>
    </div>
  )
}
