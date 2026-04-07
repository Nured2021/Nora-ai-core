'use client'

import { useRef } from 'react'
import { Monitor, ExternalLink, RefreshCw, GitCommit, FolderOpen } from 'lucide-react'

interface Props {
  previewUrl: string
  projectPath?: string
  gitCommit?: string
}

const PHASE_LABELS: Record<string, string> = {
  planning: 'Planning',
  generating: 'Generating',
  writing: 'Writing to disk',
  installing: 'Installing deps',
  running: 'Starting preview',
  completed: 'Completed',
}

export function PreviewPanel({ previewUrl, projectPath, gitCommit }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = previewUrl
    }
  }

  return (
    <div className="bg-nora-surface border border-nora-accent/40 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-nora-border">
        <Monitor className="w-4 h-4 text-nora-accent shrink-0" />
        <span className="text-xs font-bold text-nora-accent flex-1">LIVE PREVIEW</span>
        <div className="flex items-center gap-3">
          {gitCommit && (
            <span className="flex items-center gap-1 text-xs font-mono text-nora-muted">
              <GitCommit className="w-3 h-3" />
              {gitCommit}
            </span>
          )}
          {projectPath && (
            <span className="flex items-center gap-1 text-xs font-mono text-nora-muted truncate max-w-xs">
              <FolderOpen className="w-3 h-3 shrink-0" />
              {projectPath}
            </span>
          )}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-nora-accent hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {previewUrl}
          </a>
        </div>
      </div>

      {/* iframe */}
      <div className="relative" style={{ height: '480px' }}>
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0 bg-white"
          title="NORA Live Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        <button
          onClick={handleReload}
          className="absolute top-2 right-2 bg-nora-surface/80 border border-nora-border rounded p-1.5 text-nora-muted hover:text-nora-text transition-colors"
          title="Reload preview"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}


// ─── Phase badge shown while build is in progress ────────────────────────────

interface PhaseBadgeProps {
  phase: string
}

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  const label = PHASE_LABELS[phase] ?? phase

  const color =
    phase === 'completed'
      ? 'text-nora-success border-nora-success/40 bg-nora-success/10'
      : phase === 'running'
      ? 'text-nora-accent border-nora-accent/40 bg-nora-accent/10 animate-pulse'
      : 'text-nora-warning border-nora-warning/40 bg-nora-warning/10'

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded border ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
