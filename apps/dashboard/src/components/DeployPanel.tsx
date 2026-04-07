'use client'

import { useEffect, useState, useCallback } from 'react'
import { ExternalLink, Rocket, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react'
import { getDeployments } from '@/lib/api'
import { Deployment } from '@/types'
import clsx from 'clsx'

interface Props {
  onDeployReady?: (deployment: Deployment) => void
  refreshTrigger?: number
}

function statusIcon(status: string) {
  switch (status) {
    case 'live':       return <CheckCircle2 className="w-3.5 h-3.5 text-nora-success" />
    case 'deploying':
    case 'pending':    return <Clock className="w-3.5 h-3.5 text-nora-accent animate-pulse" />
    case 'failed':     return <XCircle className="w-3.5 h-3.5 text-nora-error" />
    default:           return <Clock className="w-3.5 h-3.5 text-nora-muted" />
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'live':       return 'text-nora-success'
    case 'deploying':
    case 'pending':    return 'text-nora-accent'
    case 'failed':     return 'text-nora-error'
    default:           return 'text-nora-muted'
  }
}

export function DeployPanel({ onDeployReady, refreshTrigger }: Props) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getDeployments()
      .then(setDeployments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, refreshTrigger])

  return (
    <div className="bg-nora-surface border border-nora-accent/40 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-nora-border">
        <Rocket className="w-4 h-4 text-nora-accent shrink-0" />
        <span className="text-xs font-bold text-nora-accent flex-1">DEPLOYMENTS</span>
        <button
          onClick={load}
          className="text-nora-muted hover:text-nora-text transition-colors"
          title="Refresh"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-nora-border max-h-72 overflow-y-auto">
        {deployments.length === 0 && !loading && (
          <div className="px-4 py-6 text-center text-sm text-nora-muted">
            No deployments yet.{' '}
            <span className="font-mono text-nora-accent">
              /publish {'<job_id>'}
            </span>{' '}
            to publish a completed build.
          </div>
        )}
        {deployments.map((dep) => (
          <div key={dep.deployment_id} className="px-4 py-3 flex items-start gap-3">
            <div className="mt-0.5">{statusIcon(dep.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-nora-accent truncate">{dep.deployment_id}</span>
                {dep.stack && (
                  <span className="text-xs bg-nora-border px-1.5 py-0.5 rounded font-mono text-nora-muted">
                    {dep.stack}
                  </span>
                )}
                <span className={clsx('text-xs font-mono ml-auto shrink-0', statusColor(dep.status))}>
                  {dep.status}
                </span>
              </div>
              <div className="text-sm text-nora-text truncate mb-1">{dep.name}</div>
              {dep.public_url ? (
                <a
                  href={dep.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-nora-accent hover:text-white transition-colors font-mono"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  {dep.public_url}
                </a>
              ) : dep.status === 'failed' && dep.error ? (
                <span className="text-xs text-nora-error">{dep.error}</span>
              ) : (
                <span className="text-xs text-nora-muted italic">deploying…</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
