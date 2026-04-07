'use client'

import { useState, useEffect, useCallback } from 'react'
import { JobList } from '@/components/JobList'
import { LiveResults } from '@/components/LiveResults'
import { useGlobalFeed, useJobFeed } from '@/hooks/useWebSocket'
import { getJobs, getJobLogs } from '@/lib/api'
import { Job, JobLog, WsMessage } from '@/types'
import { RefreshCw } from 'lucide-react'

interface LogEntry {
  id: string
  message: string
  level: string
  step?: number
  created_at: string
  job_id?: string
}

export default function LiveJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchJobs = useCallback(() => {
    setLoading(true)
    getJobs(50).then(setJobs).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleSelect = async (job: Job) => {
    setSelectedJob(job)
    setLogs([])
    try {
      const entries: JobLog[] = await getJobLogs(job.job_id)
      setLogs(entries.map((e) => ({
        id: String(e.id),
        message: e.message,
        level: e.level,
        step: e.step ?? undefined,
        created_at: e.created_at,
        job_id: e.job_id,
      })))
    } catch {}
  }

  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type === 'job_log' && selectedJob && msg.job_id === selectedJob.job_id) {
      setLogs((prev) => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        message: msg.message || '',
        level: msg.level || 'INFO',
        step: msg.step,
        created_at: new Date().toISOString(),
        job_id: msg.job_id,
      }])
    }
    if (msg.type === 'job_update' || msg.type === 'job_created') {
      fetchJobs()
    }
  }, [selectedJob, fetchJobs])

  useGlobalFeed(handleWs)

  return (
    <div className="flex h-full p-4 gap-4">
      {/* Job list */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-nora-text">LIVE JOBS</h2>
          <button
            onClick={fetchJobs}
            className="text-nora-muted hover:text-nora-text transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <JobList
            jobs={jobs}
            selectedJobId={selectedJob?.job_id}
            onSelect={handleSelect}
          />
        </div>
      </div>

      {/* Log viewer */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        {selectedJob ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-nora-accent">{selectedJob.job_id}</span>
              <span className="text-xs text-nora-muted">{selectedJob.command}</span>
              <span className="text-xs text-nora-text truncate flex-1">{selectedJob.input_text}</span>
              <span className={`text-xs font-mono ${
                selectedJob.status === 'running' ? 'text-nora-accent animate-pulse' :
                selectedJob.status === 'completed' ? 'text-nora-success' :
                selectedJob.status === 'failed' ? 'text-nora-error' :
                'text-nora-muted'
              }`}>{selectedJob.status}</span>
            </div>
            <div className="flex-1 min-h-0">
              <LiveResults
                logs={logs}
                title={`LOGS — ${selectedJob.job_id}`}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-nora-muted text-sm">
            Select a job to view its live logs
          </div>
        )}
      </div>
    </div>
  )
}
