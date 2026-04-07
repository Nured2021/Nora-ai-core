'use client'

import { useState, useEffect } from 'react'
import { getAnalytics, sendCommand } from '@/lib/api'
import { AnalyticsSummary } from '@/types'
import { BarChart3, Activity, CheckCircle, XCircle, Globe, Terminal, RefreshCw } from 'lucide-react'

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [cmdResult, setCmdResult] = useState<string | null>(null)
  const [cmdRunning, setCmdRunning] = useState(false)

  const load = async () => {
    try {
      const res = await getAnalytics()
      setData(res)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCmd = async () => {
    setCmdRunning(true)
    setCmdResult(null)
    try {
      const res = await sendCommand('/analytics dashboard')
      setCmdResult(JSON.stringify(res, null, 2))
      await load()
    } catch (e: unknown) {
      setCmdResult(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setCmdRunning(false)
    }
  }

  const successRate = data
    ? data.total_jobs > 0
      ? Math.round((data.completed_jobs / data.total_jobs) * 100)
      : 0
    : 0

  const deployRate = data
    ? data.total_deployments > 0
      ? Math.round((data.live_deployments / data.total_deployments) * 100)
      : 0
    : 0

  const maxJobDay = data ? Math.max(...data.jobs_last_7d.map((d) => d.count), 1) : 1

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-nora-accent flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-nora-text">Analytics Center</h1>
          <p className="text-xs text-nora-muted">Phase 6 · Metrics command center · System performance</p>
        </div>
        <button onClick={load} className="text-nora-muted hover:text-nora-text transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-nora-muted animate-pulse">Loading analytics...</div>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              icon={<Activity className="w-4 h-4" />}
              label="Total Jobs"
              value={data?.total_jobs ?? 0}
              sub={`${successRate}% success rate`}
            />
            <KPICard
              icon={<CheckCircle className="w-4 h-4 text-green-400" />}
              label="Completed Jobs"
              value={data?.completed_jobs ?? 0}
              color="text-green-400"
            />
            <KPICard
              icon={<XCircle className="w-4 h-4 text-nora-error" />}
              label="Failed Jobs"
              value={data?.failed_jobs ?? 0}
              color="text-nora-error"
            />
            <KPICard
              icon={<Globe className="w-4 h-4 text-nora-accent" />}
              label="Live Deployments"
              value={data?.live_deployments ?? 0}
              sub={`of ${data?.total_deployments ?? 0} total`}
              color="text-nora-accent"
            />
          </div>

          <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">
            {/* Left: command + top commands */}
            <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
              {/* Command shortcut */}
              <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-4 h-4 text-nora-accent" />
                  <span className="text-sm font-bold text-nora-text">Command</span>
                </div>
                <button
                  onClick={handleCmd}
                  disabled={cmdRunning}
                  className="w-full py-2 rounded text-sm font-bold bg-nora-accent hover:bg-nora-accent/80 text-white transition-all disabled:opacity-50 mb-2"
                >
                  {cmdRunning ? 'Running...' : '/analytics dashboard'}
                </button>
                {cmdResult && (
                  <pre className="text-xs text-nora-muted bg-nora-bg rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {cmdResult}
                  </pre>
                )}
              </div>

              {/* Top commands */}
              <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
                <div className="text-sm font-bold text-nora-text mb-3">Top Commands</div>
                {(data?.top_commands ?? []).length === 0 ? (
                  <div className="text-xs text-nora-muted italic">No command data yet.</div>
                ) : (
                  <div className="space-y-2">
                    {data!.top_commands.map((row, i) => {
                      const maxCount = data!.top_commands[0]?.count || 1
                      const pct = Math.round((row.count / maxCount) * 100)
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-nora-muted font-mono">{row.command}</span>
                            <span className="text-nora-text">{row.count}</span>
                          </div>
                          <div className="h-1.5 bg-nora-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-nora-accent rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: jobs chart (last 7 days) + deployment stats */}
            <div className="flex-1 flex flex-col gap-3">
              {/* 7-day jobs chart */}
              <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
                <div className="text-sm font-bold text-nora-text mb-4">Jobs — Last 7 Days</div>
                {(data?.jobs_last_7d ?? []).length === 0 ? (
                  <div className="text-xs text-nora-muted italic">No job data for the last 7 days.</div>
                ) : (
                  <div className="flex items-end gap-2 h-24">
                    {data!.jobs_last_7d.map((row, i) => {
                      const pct = maxJobDay > 0 ? Math.round((row.count / maxJobDay) * 100) : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="text-xs text-nora-muted">{row.count}</div>
                          <div
                            className="w-full bg-nora-accent/60 rounded-t transition-all hover:bg-nora-accent"
                            style={{ height: `${Math.max(pct, 4)}%`, minHeight: '4px' }}
                            title={`${row.day}: ${row.count} jobs`}
                          />
                          <div className="text-xs text-nora-muted truncate w-full text-center">
                            {row.day?.slice(5) ?? ''}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Deployment stats */}
              <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
                <div className="text-sm font-bold text-nora-text mb-3">Deployment Stats</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-nora-muted mb-2">Total Deployments</div>
                    <div className="h-3 bg-nora-border rounded-full overflow-hidden">
                      <div className="h-full bg-nora-accent rounded-full" style={{ width: '100%' }} />
                    </div>
                    <div className="text-xl font-bold text-nora-text mt-1">{data?.total_deployments ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-nora-muted mb-2">Live ({deployRate}%)</div>
                    <div className="h-3 bg-nora-border rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${deployRate}%` }} />
                    </div>
                    <div className="text-xl font-bold text-green-400 mt-1">{data?.live_deployments ?? 0}</div>
                  </div>
                </div>
              </div>

              {data?.generated_at && (
                <div className="text-xs text-nora-muted text-right">
                  Generated: {new Date(data.generated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KPICard({ icon, label, value, sub, color = 'text-nora-text' }: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-nora-muted">{icon}</span>
        <span className="text-xs text-nora-muted">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-nora-muted mt-0.5">{sub}</div>}
    </div>
  )
}
