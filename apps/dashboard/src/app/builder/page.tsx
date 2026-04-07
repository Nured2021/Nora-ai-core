'use client'

import { useState, useCallback } from 'react'
import { CommandInput } from '@/components/CommandInput'
import { LiveResults } from '@/components/LiveResults'
import { JobList } from '@/components/JobList'
import { useGlobalFeed } from '@/hooks/useWebSocket'
import { getJobs } from '@/lib/api'
import { Job, WsMessage } from '@/types'
import { Hammer } from 'lucide-react'

interface LogEntry {
  id: string
  message: string
  level: string
  step?: number
  created_at: string
  job_id?: string
}

const EXAMPLES = [
  'build a CRM with chat functionality',
  'build a REST API with authentication',
  'build a React dashboard with charts',
  'build a todo app with React and FastAPI',
  'build a full-stack e-commerce app',
]

export default function BuilderPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [fillValue, setFillValue] = useState('')
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type === 'job_log') {
      setLogs((prev) => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        message: msg.message || '',
        level: msg.level || 'INFO',
        step: msg.step,
        created_at: new Date().toISOString(),
        job_id: msg.job_id,
      }])
    }
    if (msg.type === 'job_created' || msg.type === 'job_update') {
      getJobs(20).then(setJobs).catch(() => {})
    }
  }, [])

  useGlobalFeed(handleWs)

  const handleResult = (result: Record<string, unknown>) => {
    setLogs((prev) => [...prev, {
      id: `cmd-${Date.now()}`,
      message: `→ ${JSON.stringify(result)}`,
      level: result.type === 'error' ? 'ERROR' : 'INFO',
      created_at: new Date().toISOString(),
    }])
    if (result.type === 'job_created') {
      setActiveJobId(result.job_id as string)
      getJobs(20).then(setJobs).catch(() => {})
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Hammer className="w-5 h-5 text-nora-accent" />
        <h1 className="text-lg font-bold text-nora-text">System Builder</h1>
        <span className="text-xs text-nora-muted">NORA-BUILDER · NORA-ARCH · NORA-CODE</span>
      </div>

      {/* Example prompts */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <span
            key={ex}
            onClick={() => setFillValue(`build ${ex.replace(/^build /, '')}`)}
            className="text-xs bg-nora-surface border border-nora-border rounded-full px-3 py-1 text-nora-muted hover:text-nora-text hover:border-nora-accent cursor-pointer transition-colors"
          >
            {ex}
          </span>
        ))}
      </div>

      <CommandInput onResult={handleResult} fillValue={fillValue} />

      {/* Live logs + job list */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: '200px' }}>
        <div className="flex-1 min-h-0">
          <LiveResults logs={logs} showJobId />
        </div>
        <div className="w-64 shrink-0 overflow-y-auto">
          <div className="text-xs font-medium text-nora-muted mb-2">BUILD JOBS</div>
          <JobList jobs={jobs} selectedJobId={selectedJob?.job_id} onSelect={setSelectedJob} />
        </div>
      </div>
    </div>
  )
}
