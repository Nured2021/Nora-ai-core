'use client'

import { useState, useEffect, useCallback } from 'react'
import { getGlobalNetwork, sendCommand } from '@/lib/api'
import { GlobalNetwork, NetworkNode } from '@/types'
import { Globe, RefreshCw, Wifi, WifiOff, AlertCircle, Activity } from 'lucide-react'
import { useGlobalFeed } from '@/hooks/useWebSocket'
import { WsMessage } from '@/types'

const STATUS_ICON: Record<string, React.ReactNode> = {
  online:  <Wifi className="w-3 h-3 text-green-500" />,
  standby: <AlertCircle className="w-3 h-3 text-yellow-500" />,
  offline: <WifiOff className="w-3 h-3 text-nora-error" />,
}

const STATUS_COLOR: Record<string, string> = {
  online:  'text-green-500',
  standby: 'text-yellow-500',
  offline: 'text-nora-error',
}

export default function GlobalNetworkPage() {
  const [network, setNetwork] = useState<GlobalNetwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [lastJobId, setLastJobId] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await getGlobalNetwork()
      setNetwork(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (lastJobId && msg.job_id === lastJobId) {
      if (msg.type === 'job_log' && msg.message) {
        setLogs((prev) => [...prev.slice(-49), msg.message!])
      }
      if (msg.type === 'job_update' && msg.status === 'completed') {
        setSyncing(false)
        load()
      }
    }
  }, [lastJobId])

  useGlobalFeed(handleWsMessage)

  const handleSync = async () => {
    setSyncing(true)
    setLogs([])
    try {
      const res = await sendCommand('/global connect')
      if (res.job_id) setLastJobId(res.job_id)
    } catch {
      setSyncing(false)
    }
  }

  const onlineCount = network?.nodes.filter((n) => n.status === 'online').length ?? 0
  const totalCount = network?.nodes.length ?? 0

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-nora-accent" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-nora-text">GLOBAL NETWORK</h1>
          <p className="text-xs text-nora-muted">
            NORA-GLOBAL · {onlineCount}/{totalCount} nodes online
          </p>
        </div>
        <div className="flex items-center gap-2">
          {network && (
            <span className={`text-xs font-bold px-2 py-1 rounded border ${
              network.status === 'CONNECTED'
                ? 'border-green-500/50 bg-green-500/10 text-green-500'
                : 'border-nora-border text-nora-muted'
            }`}>
              {network.status}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-nora-accent text-white rounded text-xs hover:bg-nora-accent/90 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : '/global connect'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">
        {/* Node grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-nora-muted text-sm animate-pulse">Loading network...</div>
          ) : (
            <>
              {network?.message && (
                <div className="mb-3 p-3 bg-nora-surface border border-nora-border rounded-lg text-xs text-nora-muted">
                  {network.message}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {network?.nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`bg-nora-surface border rounded-lg p-4 transition-colors ${
                      node.status === 'online'
                        ? 'border-green-500/30'
                        : node.status === 'standby'
                        ? 'border-yellow-500/30'
                        : 'border-nora-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-nora-text">{node.id}</span>
                      <div className="flex items-center gap-1">
                        {STATUS_ICON[node.status]}
                        <span className={`text-xs font-medium ${STATUS_COLOR[node.status]}`}>
                          {node.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-nora-muted">
                      Region: <span className="text-nora-text font-mono">{node.region}</span>
                    </div>
                    {node.latency_ms > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Activity className="w-3 h-3 text-nora-muted" />
                        <span className="text-xs text-nora-muted">
                          {node.latency_ms}ms latency
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {network?.last_sync && (
                <div className="mt-3 text-xs text-nora-muted">
                  Last sync: {new Date(network.last_sync).toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Live sync log */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-nora-muted" />
            <span className="text-sm font-medium text-nora-text">Sync Log</span>
            {syncing && <span className="text-xs text-nora-accent animate-pulse ml-auto">live</span>}
          </div>
          <div className="flex-1 bg-nora-surface border border-nora-border rounded-lg p-3 font-mono text-xs overflow-y-auto min-h-48 space-y-1">
            {logs.length === 0 && !syncing && (
              <div className="text-nora-muted italic">
                Click &quot;/global connect&quot; to sync the network.
              </div>
            )}
            {logs.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes('✓') || line.includes('CONNECTED') ? 'text-green-400'
                  : line.includes('✗') || line.includes('OFFLINE') ? 'text-nora-error'
                  : line.includes('⚠') ? 'text-yellow-400'
                  : 'text-nora-muted'
                }
              >
                {line}
              </div>
            ))}
            {syncing && (
              <div className="text-nora-accent animate-pulse">Connecting...</div>
            )}
          </div>

          {/* Command hint */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-3 text-xs text-nora-muted space-y-1">
            <div className="font-medium text-nora-text mb-1">Commands</div>
            <div className="font-mono bg-nora-bg px-2 py-1 rounded">/global connect</div>
            <div className="font-mono bg-nora-bg px-2 py-1 rounded">/global sync</div>
            <div className="text-nora-muted mt-1">Activate GOD MODE for full connectivity.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
