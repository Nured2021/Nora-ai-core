'use client'

import { useState, useEffect } from 'react'
import { getAllModules, getEvolvedModules } from '@/lib/api'
import { Phase5Module, EvolvedModule } from '@/types'
import { Cpu, Zap, CheckCircle2, Layers } from 'lucide-react'

const PHASE_COLORS: Record<number, string> = {
  1: 'text-indigo-400',
  2: 'text-blue-400',
  3: 'text-cyan-400',
  4: 'text-teal-400',
  5: 'text-purple-400',
}

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1',
  2: 'Phase 2',
  3: 'Phase 3',
  4: 'Phase 4',
  5: 'Phase 5',
}

export default function AiCorePage() {
  const [modules, setModules] = useState<Phase5Module[]>([])
  const [evolved, setEvolved] = useState<EvolvedModule[]>([])
  const [filter, setFilter] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllModules(), getEvolvedModules()])
      .then(([mods, ev]) => {
        setModules(mods)
        setEvolved(ev)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter ? modules.filter((m) => m.phase === filter) : modules
  const phase5Count = modules.filter((m) => m.phase === 5).length

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Cpu className="w-5 h-5 text-nora-accent" />
        <div>
          <h1 className="text-lg font-bold text-nora-text">AI CORE</h1>
          <p className="text-xs text-nora-muted">
            {modules.length} built-in modules + {evolved.length} evolved · Phase 5 adds {phase5Count} new modules
          </p>
        </div>
      </div>

      {/* Phase filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 rounded text-xs border transition-colors ${
            filter === null ? 'border-nora-accent bg-nora-accent/10 text-nora-text' : 'border-nora-border text-nora-muted hover:border-nora-accent/50'
          }`}
        >
          All ({modules.length})
        </button>
        {[1, 2, 3, 4, 5].map((p) => {
          const count = modules.filter((m) => m.phase === p).length
          return (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1 rounded text-xs border transition-colors ${
                filter === p ? 'border-nora-accent bg-nora-accent/10 text-nora-text' : 'border-nora-border text-nora-muted hover:border-nora-accent/50'
              }`}
            >
              {PHASE_LABELS[p]} ({count})
            </button>
          )
        })}
      </div>

      {/* Module grid */}
      {loading ? (
        <div className="text-nora-muted text-sm animate-pulse">Loading AI modules...</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((mod) => (
              <div
                key={mod.number}
                className="bg-nora-surface border border-nora-border rounded-lg p-3 flex gap-3 items-start"
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs font-mono text-nora-muted w-7 text-center">#{mod.number}</span>
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold font-mono ${PHASE_COLORS[mod.phase] || 'text-nora-accent'}`}>
                      {mod.name}
                    </span>
                    <span className="text-xs text-nora-muted ml-auto shrink-0">
                      {PHASE_LABELS[mod.phase]}
                    </span>
                  </div>
                  <p className="text-xs text-nora-muted mt-0.5 leading-relaxed">{mod.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Evolved modules section */}
          {evolved.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-nora-text">Evolved Modules</span>
                <span className="text-xs text-nora-muted">({evolved.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {evolved.map((mod) => (
                  <div
                    key={mod.id}
                    className="bg-nora-surface border border-yellow-500/30 rounded-lg p-3 flex gap-3 items-start"
                  >
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="text-xs font-mono text-yellow-400 w-7 text-center">#{mod.id}</span>
                      <Zap className="w-3 h-3 text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-yellow-400">{mod.name}</span>
                        <span className="text-xs text-nora-muted ml-auto">Evolved</span>
                      </div>
                      <p className="text-xs text-nora-muted mt-0.5 leading-relaxed">{mod.description}</p>
                      <p className="text-xs text-nora-muted mt-1 italic line-clamp-2">{mod.capabilities}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evolved.length === 0 && !loading && (
            <div className="mt-4 text-xs text-nora-muted italic">
              No evolved modules yet. Use <code className="bg-nora-border px-1 rounded">/evolve new &lt;description&gt;</code> to create one.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
