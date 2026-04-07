'use client'

import { useState, useEffect, useCallback } from 'react'
import { getGodModeState, getSystemStatus, sendCommand } from '@/lib/api'
import { GodModeState, SystemStatus, WsMessage } from '@/types'
import { useGlobalFeed } from '@/hooks/useWebSocket'
import { Zap, Shield, Activity, Brain, Cpu, Globe, Sparkles, AlertTriangle } from 'lucide-react'

interface LogEntry {
  id: string
  message: string
  level: string
}

const PIPELINE_STAGES = [
  { id: 'god_arch',      label: 'NORA-ARCH',      desc: 'Architecture Design' },
  { id: 'god_code',      label: 'NORA-CODE',      desc: 'Code Generation' },
  { id: 'god_write',     label: 'NORA-FS',        desc: 'Write to Disk' },
  { id: 'god_install',   label: 'NORA-INSTALL',   desc: 'Install Dependencies' },
  { id: 'god_preview',   label: 'NORA-PREVIEW',   desc: 'Live Preview' },
  { id: 'god_selfcheck', label: 'NORA-CONSCIOUS', desc: 'Self-Verification' },
  { id: 'completed',     label: 'NORA-GOD',       desc: 'Pipeline Complete' },
]

export default function GodModePage() {
  const [godMode, setGodMode] = useState<GodModeState | null>(null)
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [running, setRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [godInput, setGodInput] = useState('')
  const [completed, setCompleted] = useState(false)

  const load = async () => {
    try {
      const [gm, st] = await Promise.all([getGodModeState(), getSystemStatus()])
      setGodMode(gm)
      setStatus(st)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (activeJobId && msg.job_id === activeJobId) {
      if (msg.type === 'job_log' && msg.message) {
        setLogs((prev) => [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          message: msg.message!,
          level: msg.level || 'INFO',
        }])
      }
      if (msg.type === 'job_phase' && msg.phase) {
        setCurrentPhase(msg.phase)
      }
      if (msg.type === 'job_update') {
        if (msg.status === 'completed') {
          setRunning(false)
          setCompleted(true)
          setCurrentPhase('completed')
          load()
        }
        if (msg.status === 'failed') {
          setRunning(false)
          setCurrentPhase(null)
        }
      }
    }
    // God mode toggle broadcast
    if (msg.type === 'god_mode_change') {
      load()
    }
  }, [activeJobId])

  useGlobalFeed(handleWsMessage)

  const handleToggle = async () => {
    setToggling(true)
    try {
      const res = await sendCommand(godMode?.active ? '/god mode off' : '/god mode on')
      setGodMode((prev) => prev ? { ...prev, active: !prev.active } : prev)
      await load()
    } catch {
    } finally {
      setToggling(false)
    }
  }

  const handleRunPipeline = async () => {
    if (!godInput.trim()) return
    setRunning(true)
    setCompleted(false)
    setLogs([])
    setCurrentPhase(null)
    try {
      const res = await sendCommand(`/god mode on`)
      // Then trigger god mode pipeline via build with god mode active
      const buildRes = await sendCommand(godInput.trim())
      if (buildRes.job_id) setActiveJobId(buildRes.job_id)
    } catch {
      setRunning(false)
    }
  }

  const isActive = godMode?.active ?? false

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
          isActive ? 'bg-purple-600 shadow-lg shadow-purple-500/40' : 'bg-nora-surface border border-nora-border'
        }`}>
          <Zap className={`w-4 h-4 ${isActive ? 'text-white' : 'text-nora-muted'}`} />
        </div>
        <div className="flex-1">
          <h1 className={`text-lg font-bold ${isActive ? 'text-purple-300' : 'text-nora-text'}`}>
            GOD MODE {isActive ? '— ACTIVE ⚡' : '— INACTIVE'}
          </h1>
          <p className="text-xs text-nora-muted">
            NORA-GOD · Full autonomous control · All 50 modules active
          </p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">
        {/* Left column: toggle + status + pipeline input */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
          {/* God Mode toggle */}
          <div className={`bg-nora-surface border rounded-lg p-4 transition-all ${
            isActive ? 'border-purple-500/50' : 'border-nora-border'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-nora-text">GOD MODE SWITCH</span>
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-400 animate-pulse' : 'bg-nora-border'}`} />
            </div>
            {loading ? (
              <div className="text-xs text-nora-muted animate-pulse">Loading...</div>
            ) : (
              <>
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className={`w-full py-2.5 rounded font-bold text-sm transition-all ${
                    isActive
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-nora-border hover:bg-nora-accent/20 text-nora-muted hover:text-nora-text border border-nora-border'
                  } disabled:opacity-50`}
                >
                  {toggling ? '...' : isActive ? '⚡ DEACTIVATE' : 'ACTIVATE GOD MODE'}
                </button>
                {isActive && godMode?.activated_at && (
                  <div className="mt-2 text-xs text-nora-muted text-center">
                    Active since {new Date(godMode.activated_at).toLocaleTimeString()}
                  </div>
                )}
                {!isActive && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-nora-muted">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-yellow-500" />
                    <span>GOD MODE bypasses HumanLoop. Requires ADMIN or DEVELOPER role.</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* System status */}
          {status && (
            <div className="bg-nora-surface border border-nora-border rounded-lg p-4 space-y-2">
              <div className="text-sm font-bold text-nora-text mb-2">System Status</div>
              <StatusRow icon={<Cpu className="w-3 h-3" />}   label="Modules"      value={`${status.active_modules}/50`} />
              <StatusRow icon={<Brain className="w-3 h-3" />}  label="Brain Layers" value={`${status.brain_layers} layers`} />
              <StatusRow icon={<Globe className="w-3 h-3" />}  label="Network"      value={status.global_network} />
              <StatusRow icon={<Sparkles className="w-3 h-3" />} label="Dream Mode" value={status.dream_mode} />
              <StatusRow icon={<Activity className="w-3 h-3" />} label="Awareness"  value={status.consciousness_level} highlight />
              <StatusRow icon={<Shield className="w-3 h-3" />}  label="Evolved"     value={`${status.evolved_modules} modules`} />
            </div>
          )}

          {/* Commands */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-3 text-xs text-nora-muted space-y-1">
            <div className="font-medium text-nora-text mb-2">Commands</div>
            <div className="font-mono bg-nora-bg px-2 py-1 rounded">/god mode on</div>
            <div className="font-mono bg-nora-bg px-2 py-1 rounded">/god mode off</div>
            <div className="font-mono bg-nora-bg px-2 py-1 rounded">/consciousness</div>
            <div className="font-mono bg-nora-bg px-2 py-1 rounded">/self-upgrade</div>
          </div>
        </div>

        {/* Right column: pipeline runner + live log */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Pipeline input */}
          <div className={`bg-nora-surface border rounded-lg p-4 ${isActive ? 'border-purple-500/30' : 'border-nora-border'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-nora-muted'}`} />
              <span className="text-sm font-bold text-nora-text">GOD MODE PIPELINE</span>
              {!isActive && <span className="text-xs text-nora-muted">(activate GOD MODE first)</span>}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={godInput}
                onChange={(e) => setGodInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !running && isActive && handleRunPipeline()}
                placeholder="build a SaaS dashboard with auth"
                disabled={!isActive || running}
                className="flex-1 bg-nora-bg border border-nora-border rounded px-3 py-2 text-sm text-nora-text placeholder:text-nora-muted focus:outline-none focus:border-nora-accent disabled:opacity-50"
              />
              <button
                onClick={handleRunPipeline}
                disabled={!isActive || running || !godInput.trim()}
                className={`px-4 py-2 rounded text-sm font-bold transition-all ${
                  isActive && !running
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-nora-border text-nora-muted opacity-50'
                } disabled:opacity-40`}
              >
                {running ? 'Running...' : '⚡ Execute'}
              </button>
            </div>

            {/* Pipeline stages */}
            <div className="flex gap-1 flex-wrap">
              {PIPELINE_STAGES.map((stage, i) => {
                const stagePhases = [stage.id, `god_${stage.id.replace('god_', '')}`]
                const isCurrentStage = stagePhases.includes(currentPhase || '')
                  || stage.id === currentPhase
                const isDone = completed && stage.id !== currentPhase
                  || (currentPhase && PIPELINE_STAGES.findIndex(s => s.id === currentPhase) > i)

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all ${
                      isCurrentStage
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300 animate-pulse'
                        : isDone
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-nora-border text-nora-muted'
                    }`}
                  >
                    <span className="font-mono">{stage.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live log */}
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-nora-muted" />
              <span className="text-sm font-medium text-nora-text">Live Pipeline Log</span>
              {running && <span className="text-xs text-purple-400 animate-pulse ml-auto">⚡ running</span>}
              {completed && <span className="text-xs text-green-400 ml-auto">✓ complete</span>}
            </div>
            <div className="flex-1 bg-nora-surface border border-nora-border rounded-lg p-3 font-mono text-xs overflow-y-auto space-y-0.5">
              {logs.length === 0 && !running && (
                <div className="text-nora-muted italic">
                  {isActive
                    ? 'Enter a build description above and click ⚡ Execute.'
                    : 'Activate GOD MODE to run the autonomous pipeline.'}
                </div>
              )}
              {logs.map((entry) => (
                <div
                  key={entry.id}
                  className={
                    entry.level === 'SUCCESS' || entry.message.includes('✓') ? 'text-green-400'
                    : entry.level === 'ERROR' ? 'text-nora-error'
                    : entry.level === 'WARN' ? 'text-yellow-400'
                    : entry.message.includes('⚡') || entry.message.includes('GOD') ? 'text-purple-300'
                    : 'text-nora-muted'
                  }
                >
                  {entry.message}
                </div>
              ))}
              {running && <div className="text-purple-400 animate-pulse">▌</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({
  icon, label, value, highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-nora-muted">{icon}</span>
      <span className="text-xs text-nora-muted flex-1">{label}</span>
      <span className={`text-xs font-mono ${highlight ? 'text-nora-accent' : 'text-nora-text'}`}>{value}</span>
    </div>
  )
}
