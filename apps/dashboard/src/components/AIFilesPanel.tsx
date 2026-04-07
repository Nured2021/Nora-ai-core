'use client'

import { useState } from 'react'
import { AIFile } from '@/types'
import { FileCode2, Eye, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  files: AIFile[]
}

export function AIFilesPanel({ files }: Props) {
  const [selected, setSelected] = useState<AIFile | null>(files[0] ?? null)

  if (files.length === 0) return null

  return (
    <div className="bg-nora-surface border border-nora-success/30 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-nora-border shrink-0">
        <FileCode2 className="w-4 h-4 text-nora-success" />
        <span className="text-xs font-bold text-nora-success">
          GENERATED FILES ({files.length})
        </span>
      </div>

      <div className="flex flex-1 min-h-0" style={{ maxHeight: '340px' }}>
        {/* File list */}
        <div className="w-56 shrink-0 border-r border-nora-border overflow-y-auto">
          {files.map((f) => (
            <button
              key={f.path}
              onClick={() => setSelected(f)}
              className={clsx(
                'w-full text-left flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b border-nora-border/50 transition-colors',
                selected?.path === f.path
                  ? 'bg-nora-accent/10 text-nora-accent'
                  : 'text-nora-muted hover:text-nora-text hover:bg-nora-border/30'
              )}
            >
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="truncate">{f.path}</span>
            </button>
          ))}
        </div>

        {/* File content preview */}
        <div className="flex-1 overflow-auto">
          {selected ? (
            <div className="h-full">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-nora-border bg-nora-border/20 sticky top-0">
                <Eye className="w-3.5 h-3.5 text-nora-muted" />
                <span className="text-xs font-mono text-nora-muted">{selected.path}</span>
              </div>
              <pre className="text-xs font-mono text-nora-text p-4 whitespace-pre-wrap break-all leading-relaxed">
                {selected.content}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-nora-muted text-xs">
              Select a file to preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
