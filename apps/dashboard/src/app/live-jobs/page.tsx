'use client'

import { useState, useEffect, useCallback } from 'react'
import { JobList } from '@/components/JobList'
import { LiveResults } from '@/components/LiveResults'
import { AIPlanPanel } from '@/components/AIPlanPanel'
import { AIFilesPanel } from '@/components/AIFilesPanel'
import { PreviewPanel, PhaseBadge } from '@/components/PreviewPanel'
import { useGlobalFeed } from '@/hooks/useWebSocket'
import { getJobs, getJob, getJobLogs } from '@/lib/api'
import { Job, JobLog, WsMessage, AIPlan, AIFile } from '@/types'
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
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null)
  const [aiFiles, setAiFiles] = useState<AIFile[]>([])
  const [phase, setPhase] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [projectPath, setProjectPath] = useState<string>('')
  const [gitCommit, setGitCommit] = useState<string>('')

  const fetchJobs = useCallback(() => {
    setLoading(true)
    getJobs(50).then(setJobs).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleSelect = async (job: Job) => {
    setSelectedJob(job)
    setLogs([])
    setAiPlan(null)
    setAiFiles([])
    setPhase('')
    setPreviewUrl('')
    setProjectPath('')
    setGitCommit('')
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
    // Fetch full job for AI plan + Phase 3 results
    try {
      const fullJob: Job = await getJob(job.job_id)
      if (fullJob.result?.plan) setAiPlan(fullJob.result.plan)
      if (fullJob.result?.files) setAiFiles(fullJob.result.files)
      if (fullJob.result?.preview_url) setPreviewUrl(fullJob.result.preview_url)
      if (fullJob.result?.project_path) setProjectPath(fullJob.result.project_path)
      if (fullJob.result?.git_commit) setGitCommit(fullJob.result.git_commit)
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
    if (msg.type === 'ai_plan' && selectedJob && msg.job_id === selectedJob.job_id && msg.plan) {
      setAiPlan(msg.plan)
    }
    // Phase 3: phase updates
    if (msg.type === 'job_phase' && selectedJob && msg.job_id === selectedJob.job_id && msg.phase) {
      setPhase(msg.phase)
    }
    // Phase 3: preview ready
    if (msg.type === 'preview_ready' && selectedJob && msg.job_id === selectedJob.job_id) {
      if (msg.preview_url) setPreviewUrl(msg.preview_url)
      if (msg.project_path) setProjectPath(msg.project_path)
      if (msg.git_commit) setGitCommit(msg.git_commit)
    }
    if (
      msg.type === 'job_update' &&
      msg.status === 'completed' &&
      selectedJob &&
      msg.job_id === selectedJob.job_id
    ) {
      getJob(msg.job_id!).then((job: Job) => {
        if (job.result?.files) setAiFiles(job.result.files)
        if (job.result?.preview_url) setPreviewUrl(job.result.preview_url)
        if (job.result?.project_path) setProjectPath(job.result.project_path)
        if (job.result?.git_commit) setGitCommit(job.result.git_commit)
        setSelectedJob(job)
      }).catch(() => {})
    }
    if (msg.type === 'job_update' || msg.type === 'job_created') {
      fetchJobs()
    }
  }, [selectedJob, fetchJobs])

  useGlobalFeed(handleWs)

  return (
    <div className="flex h-full p-4 gap-4 overflow-hidden">
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

      {/* Detail panel */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
        {selectedJob ? (
          <>
            {/* Job header */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-xs font-mono text-nora-accent">{selectedJob.job_id}</span>
              <span className="text-xs text-nora-muted">{selectedJob.command}</span>
              <span className="text-xs text-nora-text truncate flex-1">{selectedJob.input_text}</span>
              <span className={`text-xs font-mono ${
                selectedJob.status === 'running' ? 'text-nora-accent animate-pulse' :
                selectedJob.status === 'completed' ? 'text-nora-success' :
                selectedJob.status === 'failed' ? 'text-nora-error' :
                'text-nora-muted'
              }`}>{selectedJob.status}</span>
              {phase && phase !== 'completed' && <PhaseBadge phase={phase} />}
            </div>

            {/* Live logs */}
            <div className="shrink-0" style={{ height: '220px' }}>
              <LiveResults
                logs={logs}
                title={`LOGS — ${selectedJob.job_id}`}
              />
            </div>

            {/* AI Plan */}
            {aiPlan && <AIPlanPanel plan={aiPlan} />}

            {/* Generated files */}
            {aiFiles.length > 0 && <AIFilesPanel files={aiFiles} />}

            {/* Phase 3: Live Preview */}
            {previewUrl && (
              <PreviewPanel
                previewUrl={previewUrl}
                projectPath={projectPath}
                gitCommit={gitCommit}
              />
            )}
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
