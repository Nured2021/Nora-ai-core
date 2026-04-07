'use client'

import { AIPlan } from '@/types'
import { Brain, Layers, FileCode2, ListChecks } from 'lucide-react'

interface Props {
  plan: AIPlan
}

export function AIPlanPanel({ plan }: Props) {
  return (
    <div className="bg-nora-surface border border-nora-accent/40 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-nora-accent" />
        <span className="text-sm font-bold text-nora-text">
          NORA-ARCH Plan:{' '}
          <span className="text-nora-accent font-mono">{plan.name}</span>
        </span>
      </div>

      {/* Stack */}
      <div className="flex items-center gap-2 flex-wrap">
        <Layers className="w-3.5 h-3.5 text-nora-muted shrink-0" />
        <span className="text-xs text-nora-muted">Stack:</span>
        {plan.stack.map((tech) => (
          <span
            key={tech}
            className="text-xs font-mono bg-nora-accent/10 border border-nora-accent/30 text-nora-accent px-2 py-0.5 rounded"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Steps */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ListChecks className="w-3.5 h-3.5 text-nora-muted" />
            <span className="text-xs font-medium text-nora-muted">Build Steps</span>
          </div>
          <ol className="space-y-1">
            {plan.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="text-nora-accent font-mono w-4 shrink-0">{i + 1}.</span>
                <span className="text-nora-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Files to be generated */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <FileCode2 className="w-3.5 h-3.5 text-nora-muted" />
            <span className="text-xs font-medium text-nora-muted">
              Files ({plan.files.length})
            </span>
          </div>
          <ul className="space-y-1">
            {plan.files.map((file) => (
              <li key={file} className="text-xs font-mono text-nora-muted truncate">
                {file}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
