'use client'

import { useEffect, useRef } from 'react'
import { WsMessage, JobLog } from '@/types'
import clsx from 'clsx'
import { Circle, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

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
  title?: string
  showJobId?: boolean
}

const STATUS_ICON = {
  queued: <Clock className="w-3 h-3 text-nora-muted" />,
  running: <Circle className="w-3 h-3 text-nora-accent animate-pulse" />,
  completed: <CheckCircle2 className="w-3 h-3 text-nora-success" />,
  failed: <XCircle className="w-3 h-3 text-nora-error" />,
  cancelled: <XCircle className="w-3 h-3 text-nora-muted" />,
  awaiting_approval: <AlertTriangle className="w-3 h-3 text-nora-warning" />,
}

function getLevelClass(level: string) {
  switch (level.toUpperCase()) {
    case 'ERROR': return 'text-nora-error'
    case 'WARNING': return 'text-nora-warning'
    case 'SUCCESS': return 'text-nora-success'
    default: return 'text-nora-text'
  }
}

export function LiveResults({ logs, title = 'LIVE RESULTS', showJobId = false }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="bg-nora-surface border border-nora-border rounded-lg flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-nora-border shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-nora-error" />
          <div className="w-2.5 h-2.5 rounded-full bg-nora-warning" />
          <div className="w-2.5 h-2.5 rounded-full bg-nora-success" />
        </div>
        <span className="text-xs font-mono font-bold text-nora-accent ml-2">{title}</span>
        <span className="text-xs text-nora-muted ml-auto">{logs.length} entries</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5 min-h-0">
        {logs.length === 0 && (
          <div className="text-nora-muted italic">Waiting for output...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={clsx('animate-fade-in leading-relaxed', getLevelClass(log.level))}>
            {showJobId && log.job_id && (
              <span className="text-nora-accent mr-2">[{log.job_id}]</span>
            )}
            {log.step != null && (
              <span className="text-nora-muted mr-2">#{log.step}</span>
            )}
            <span>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
