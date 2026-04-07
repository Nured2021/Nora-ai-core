'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSystemHealth, sendCommand } from '@/lib/api'
import { SystemHealth, WsMessage } from '@/types'
import { useGlobalFeed } from '@/hooks/useWebSocket'
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, Zap } from 'lucide-react'

interface LogEntry { id: string; message: string; level: string }

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await getSystemHealth()
      setHealth(data)
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

  const handleDeepCheck = async () => {
    setRunning(true)
    setLogs([])
    try {
      const res = await sendCommand('/health full')
      if (res.job_id) {
        setActiveJobId(res.job_id)
      } else {
        setRunning(false)
        await load()
      }
    } catch {
      setRunning(false)
    }
  }

  const overallColor = health?.overall === 'ok' ? 'text-green-400' : health?.overall === 'degraded' ? 'text-yellow-400' : 'text-nora-error'

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
          health?.overall === 'ok' ? 'bg-green-600' : health?.overall === 'degraded' ? 'bg-yellow-600' : 'bg-nora-surface border border-nora-border'
        }`}>
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-nora-text">
            System Health{health ? <span className={` ml-2 text-base ${overallColor}`}>{health.overall.toUpperCase()}</span> : ''}
          </h1>
          <p className="text-xs text-nora-muted">Phase 6 · Live service monitoring · Infrastructure status</p>
        </div>
        <button onClick={load} className="text-nora-muted hover:text-nora-text transition-colors mr-2">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">
        {/* Left: status cards + run check */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
          {/* Deep health check */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
            <div className="text-sm font-bold text-nora-text mb-3">Run Deep Health Check</div>
            <button
              onClick={handleDeepCheck}
              disabled={running}
              className="w-full py-2.5 rounded font-bold text-sm bg-nora-accent hover:bg-nora-accent/80 text-white transition-all disabled:opacity-50"
            >
              {running ? (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-3 h-3 animate-pulse" /> Running...
                </span>
              ) : '⚡ /health full'}
            </button>
          </div>

          {/* Service statuses */}
          {health && (
            <div className="bg-nora-surface border border-nora-border rounded-lg p-4 space-y-3">
              <div className="text-sm font-bold text-nora-text">Services</div>
              {health.services.map((svc) => (
                <div key={svc.name} className="flex items-center gap-3">
                  {svc.status === 'ok' ? (
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  ) : svc.status === 'degraded' ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-nora-error shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-nora-text capitalize">{svc.name}</div>
                    {svc.details && <div className="text-xs text-nora-muted truncate">{svc.details}</div>}
                  </div>
                  <div className="text-xs text-nora-muted shrink-0">{svc.latency_ms}ms</div>
                </div>
              ))}
            </div>
          )}

          {/* Enterprise metrics */}
          {health && (
            <div className="bg-nora-surface border border-nora-border rounded-lg p-4 space-y-2">
              <div className="text-sm font-bold text-nora-text mb-2">Enterprise Metrics</div>
              {[
                { label: 'Organizations', value: health.orgs },
                { label: 'Workspaces', value: health.workspaces },
                { label: 'Team Members', value: health.team_members },
                { label: 'Audit Events', value: health.recent_audits },
                { label: 'Backups Completed', value: health.backups_completed },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-nora-muted">{label}</span>
                  <span className="text-nora-text font-mono">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: live log */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-nora-muted" />
            <span className="text-sm font-medium text-nora-text">Health Check Log</span>
            {running && <span className="text-xs text-nora-accent animate-pulse ml-auto">● running</span>}
            {!loading && !running && health && (
              <span className="text-xs text-nora-muted ml-auto">
                Checked: {new Date(health.checked_at).toLocaleTimeString()}
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-nora-surface border border-nora-border rounded-lg p-8 text-center">
              <div className="text-sm text-nora-muted animate-pulse">Loading system health...</div>
            </div>
          ) : (
            <div className="flex-1 bg-nora-surface border border-nora-border rounded-lg p-3 font-mono text-xs overflow-y-auto space-y-0.5">
              {logs.length === 0 ? (
                <div className="text-nora-muted italic">
                  Click "⚡ /health full" to run a deep health check with live logs.
                </div>
              ) : (
                logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={
                      entry.level === 'SUCCESS' || entry.message.includes('✓') ? 'text-green-400'
                      : entry.level === 'ERROR' || entry.message.includes('✗') ? 'text-nora-error'
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
          )}
        </div>
      </div>
    </div>
  )
}
