'use client'

import { useState, useEffect, useCallback } from 'react'
import { getWorkspaces, createWorkspace, sendCommand } from '@/lib/api'
import { WorkspaceRecord, WsMessage } from '@/types'
import { useGlobalFeed } from '@/hooks/useWebSocket'
import { FolderOpen, Plus, RefreshCw, Activity } from 'lucide-react'

interface LogEntry { id: string; message: string; level: string }

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  // form
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [template, setTemplate] = useState('blank')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    try {
      const data = await getWorkspaces()
      setWorkspaces(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (activeJobId && msg.job_id === activeJobId) {
      if (msg.type === 'job_log' && msg.message) {
        setLogs((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, message: msg.message!, level: msg.level || 'INFO' }])
      }
      if (msg.type === 'job_update' && (msg.status === 'completed' || msg.status === 'failed')) {
        setRunning(false)
        load()
      }
    }
  }, [activeJobId])

  useGlobalFeed(handleWsMessage)

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    setLogs([])
    try {
      // dispatch via command (gets worker task + live logs)
      const res = await sendCommand(`/workspace create ${name.trim()}`)
      if (res.job_id) {
        setActiveJobId(res.job_id)
        setRunning(true)
      }
      setName('')
      setDesc('')
    } catch {
    } finally {
      setCreating(false)
    }
  }

  const TEMPLATES = ['blank', 'nextjs', 'react', 'python-api', 'fullstack']

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-nora-accent flex items-center justify-center">
          <FolderOpen className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-nora-text">Workspace Manager</h1>
          <p className="text-xs text-nora-muted">Phase 6 · Enterprise workspace isolation and management</p>
        </div>
        <button onClick={load} className="text-nora-muted hover:text-nora-text transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">
        {/* Left: create form */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
          <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-nora-muted" />
              <span className="text-sm font-bold text-nora-text">New Workspace</span>
            </div>
            <div className="space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
                className="w-full bg-nora-bg border border-nora-border rounded px-3 py-2 text-sm text-nora-text placeholder:text-nora-muted focus:outline-none focus:border-nora-accent"
              />
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-nora-bg border border-nora-border rounded px-3 py-2 text-sm text-nora-text placeholder:text-nora-muted focus:outline-none focus:border-nora-accent"
              />
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full bg-nora-bg border border-nora-border rounded px-3 py-2 text-sm text-nora-text focus:outline-none focus:border-nora-accent"
              >
                {TEMPLATES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={handleCreate}
                disabled={creating || running || !name.trim()}
                className="w-full py-2 rounded text-sm font-bold bg-nora-accent hover:bg-nora-accent/80 text-white transition-all disabled:opacity-50"
              >
                {creating || running ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </div>

          {/* Command shortcut */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-3 text-xs space-y-1">
            <div className="font-medium text-nora-text mb-2">Quick Commands</div>
            <div className="font-mono bg-nora-bg px-2 py-1 rounded text-nora-muted">/workspace create &lt;name&gt;</div>
            <div className="font-mono bg-nora-bg px-2 py-1 rounded text-nora-muted">/workspace switch &lt;name&gt;</div>
          </div>
        </div>

        {/* Right: workspaces list + live log */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Workspaces grid */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-nora-muted" />
              <span className="text-sm font-bold text-nora-text">Workspaces</span>
              <span className="text-xs text-nora-muted bg-nora-bg px-1.5 py-0.5 rounded ml-auto">{workspaces.length}</span>
            </div>
            {loading ? (
              <div className="text-xs text-nora-muted animate-pulse">Loading workspaces...</div>
            ) : workspaces.length === 0 ? (
              <div className="text-xs text-nora-muted italic">No workspaces yet. Create one using the form.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="bg-nora-bg border border-nora-border rounded p-3 hover:border-nora-accent/40 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen className="w-3 h-3 text-nora-accent" />
                      <span className="text-sm font-medium text-nora-text truncate">{ws.name}</span>
                    </div>
                    <div className="text-xs text-nora-muted font-mono">{ws.slug}</div>
                    {ws.description && (
                      <div className="text-xs text-nora-muted mt-1 truncate">{ws.description}</div>
                    )}
                    {ws.template && (
                      <div className="text-xs text-nora-accent mt-1">template: {ws.template}</div>
                    )}
                    <div className="text-xs text-nora-muted mt-2">
                      {new Date(ws.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live creation log */}
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-nora-muted" />
              <span className="text-sm font-medium text-nora-text">Creation Log</span>
              {running && <span className="text-xs text-nora-accent animate-pulse ml-auto">● running</span>}
            </div>
            <div className="flex-1 bg-nora-surface border border-nora-border rounded-lg p-3 font-mono text-xs overflow-y-auto space-y-0.5" style={{ minHeight: '120px' }}>
              {logs.length === 0 ? (
                <div className="text-nora-muted italic">Create a workspace to see live logs here.</div>
              ) : (
                logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={
                      entry.level === 'SUCCESS' || entry.message.includes('✓') ? 'text-green-400'
                      : entry.level === 'ERROR' ? 'text-nora-error'
                      : entry.level === 'WARN' ? 'text-yellow-400'
                      : 'text-nora-muted'
                    }
                  >
                    {entry.message}
                  </div>
                ))
              )}
              {running && <div className="text-nora-accent animate-pulse">▌</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
