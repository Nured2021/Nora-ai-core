'use client'

import { Job } from '@/types'
import clsx from 'clsx'
import { Clock, CheckCircle2, XCircle, Circle, AlertTriangle, PlayCircle } from 'lucide-react'

interface Props {
  jobs: Job[]
  selectedJobId?: string | null
  onSelect?: (job: Job) => void
}

function statusIcon(status: string) {
  switch (status) {
    case 'queued': return <Clock className="w-3.5 h-3.5 text-nora-muted" />
    case 'running': return <Circle className="w-3.5 h-3.5 text-nora-accent animate-pulse" />
    case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-nora-success" />
    case 'failed': return <XCircle className="w-3.5 h-3.5 text-nora-error" />
    case 'cancelled': return <XCircle className="w-3.5 h-3.5 text-nora-muted" />
    case 'awaiting_approval': return <AlertTriangle className="w-3.5 h-3.5 text-nora-warning" />
    default: return <PlayCircle className="w-3.5 h-3.5 text-nora-muted" />
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'running': return 'text-nora-accent'
    case 'completed': return 'text-nora-success'
    case 'failed': return 'text-nora-error'
    case 'cancelled': return 'text-nora-muted'
    case 'awaiting_approval': return 'text-nora-warning'
    default: return 'text-nora-muted'
  }
}

export function JobList({ jobs, selectedJobId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      {jobs.length === 0 && (
        <div className="text-nora-muted text-sm py-4 text-center">No jobs yet. Submit a command to start.</div>
      )}
      {jobs.map((job) => (
        <button
          key={job.job_id}
          onClick={() => onSelect?.(job)}
          className={clsx(
            'w-full text-left rounded-lg border p-3 transition-colors',
            selectedJobId === job.job_id
              ? 'border-nora-accent bg-nora-accent/10'
              : 'border-nora-border bg-nora-surface hover:border-nora-accent/50'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {statusIcon(job.status)}
                <span className="text-xs font-mono text-nora-accent">{job.job_id}</span>
                <span className="text-xs font-mono text-nora-muted">{job.command}</span>
              </div>
              <div className="text-sm text-nora-text truncate">{job.input_text}</div>
            </div>
            <span className={clsx('text-xs font-mono shrink-0', statusColor(job.status))}>
              {job.status}
            </span>
          </div>
          <div className="text-xs text-nora-muted mt-1">
            {new Date(job.created_at).toLocaleString()}
          </div>
        </button>
      ))}
    </div>
  )
}
