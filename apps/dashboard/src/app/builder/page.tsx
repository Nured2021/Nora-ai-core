'use client'

import { useState, useCallback } from 'react'
import { CommandInput } from '@/components/CommandInput'
import { LiveResults } from '@/components/LiveResults'
import { JobList } from '@/components/JobList'
import { AIPlanPanel } from '@/components/AIPlanPanel'
import { AIFilesPanel } from '@/components/AIFilesPanel'
import { useGlobalFeed } from '@/hooks/useWebSocket'
import { getJobs, getJob } from '@/lib/api'
import { Job, WsMessage, AIPlan, AIFile } from '@/types'
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
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null)
  const [aiFiles, setAiFiles] = useState<AIFile[]>([])

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
    // Phase 2: receive AI plan live
    if (msg.type === 'ai_plan' && msg.job_id === activeJobId && msg.plan) {
      setAiPlan(msg.plan)
    }
    // Phase 2: when job completes, fetch full result for file content
    if (
      msg.type === 'job_update' &&
      msg.status === 'completed' &&
      msg.job_id === activeJobId
    ) {
      getJob(msg.job_id).then((job: Job) => {
        if (job.result?.files) setAiFiles(job.result.files)
      }).catch(() => {})
    }
  }, [activeJobId])

  useGlobalFeed(handleWs)

  const handleResult = (result: Record<string, unknown>) => {
    setLogs((prev) => [...prev, {
      id: `cmd-${Date.now()}`,
      message: `→ ${JSON.stringify(result)}`,
      level: result.type === 'error' ? 'ERROR' : 'INFO',
      created_at: new Date().toISOString(),
    }])
    if (result.type === 'job_created') {
      const jobId = result.job_id as string
      setActiveJobId(jobId)
      setAiPlan(null)
      setAiFiles([])
      getJobs(20).then(setJobs).catch(() => {})
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        <Hammer className="w-5 h-5 text-nora-accent" />
        <h1 className="text-lg font-bold text-nora-text">System Builder</h1>
        <span className="text-xs text-nora-muted">NORA-ARCH + NORA-CODE + AI Phase 2</span>
      </div>

      {/* Example prompts — clicking pre-fills the command input */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <span
            key={ex}
            className="text-xs bg-nora-surface border border-nora-border rounded-full px-3 py-1 text-nora-muted hover:text-nora-text hover:border-nora-accent cursor-pointer transition-colors"
            onClick={() => setFillValue(`build ${ex.replace(/^build /, '')}`)}
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

      {/* AI Plan — shown as soon as the plan is received */}
      {aiPlan && <AIPlanPanel plan={aiPlan} />}

      {/* Generated Files — shown when job completes */}
      {aiFiles.length > 0 && <AIFilesPanel files={aiFiles} />}
    </div>
  )
}

