'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Monitor, AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  previewUrl: string
  projectPath?: string
  gitCommit?: string
}

type ProbeStatus = 'checking' | 'online' | 'offline'

export function PreviewPanel({ previewUrl, projectPath, gitCommit }: Props) {
  const [status, setStatus] = useState<ProbeStatus>('checking')
  const [iframeKey, setIframeKey] = useState(0)

  // Probe whether the preview URL is reachable
  useEffect(() => {
    if (!previewUrl) return
    setStatus('checking')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    fetch(previewUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'))
      .finally(() => clearTimeout(timeout))

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [previewUrl, iframeKey])

  const refresh = () => {
    setStatus('checking')
    setIframeKey((k) => k + 1)
  }

  return (
    <div className="bg-nora-surface border border-nora-border rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-nora-border shrink-0">
        <Monitor className="w-4 h-4 text-nora-accent" />
        <span className="text-xs font-bold text-nora-accent">LIVE PREVIEW</span>

        {/* Status badge */}
        <span className={`ml-2 text-xs font-mono px-2 py-0.5 rounded-full ${
          status === 'online'   ? 'bg-nora-success/20 text-nora-success' :
          status === 'offline'  ? 'bg-nora-error/20 text-nora-error' :
          'bg-nora-muted/20 text-nora-muted animate-pulse'
        }`}>
          {status === 'checking' ? 'checking…' : status}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={refresh}
            title="Re-check preview"
            className="text-nora-muted hover:text-nora-text transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nora-muted hover:text-nora-accent transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* URL bar — always visible */}
      <div className="px-4 py-2 border-b border-nora-border bg-nora-bg shrink-0">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-nora-accent underline hover:text-nora-text break-all"
        >
          {previewUrl}
        </a>
        {(projectPath || gitCommit) && (
          <div className="flex gap-3 mt-1 text-xs text-nora-muted">
            {projectPath && <span>Path: <span className="text-nora-text">{projectPath}</span></span>}
            {gitCommit  && <span>Commit: <span className="font-mono text-nora-text">{gitCommit.slice(0, 8)}</span></span>}
          </div>
        )}
      </div>

      {/* Preview area */}
      {status === 'online' ? (
        <iframe
          key={iframeKey}
          src={previewUrl}
          className="w-full flex-1"
          style={{ minHeight: '320px', border: 'none' }}
          title="App Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-6">
          <AlertTriangle className={`w-8 h-8 ${status === 'offline' ? 'text-nora-error' : 'text-nora-muted animate-pulse'}`} />
          <div className="text-sm text-nora-text font-medium">
            {status === 'checking' ? 'Checking preview server…' : 'Preview server is not reachable'}
          </div>
          <div className="text-xs text-nora-muted max-w-xs">
            {status === 'offline'
              ? `The preview server at ${previewUrl} is not responding. Make sure the worker container is running and the port is exposed.`
              : 'Probing the preview URL…'}
          </div>
          {status === 'offline' && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={refresh}
                className="text-xs bg-nora-accent/10 border border-nora-accent/30 rounded px-3 py-1.5 text-nora-accent hover:bg-nora-accent/20 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-nora-surface border border-nora-border rounded px-3 py-1.5 text-nora-text hover:border-nora-accent transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3 h-3" /> Open URL anyway
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Small inline badge shown in job header row */
export function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span className="text-xs font-mono bg-nora-accent/10 text-nora-accent border border-nora-accent/30 rounded px-2 py-0.5">
      {phase}
    </span>
  )
}
