'use client'

import { useState, useEffect } from 'react'
import { getTactics, createTactic, runTactic } from '@/lib/api'
import { Tactic } from '@/types'
import { BookMarked, Play, Plus, X, Check } from 'lucide-react'

export default function TacticsPage() {
  const [tactics, setTactics] = useState<Tactic[]>([])
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSteps, setNewSteps] = useState('')
  const [running, setRunning] = useState<number | null>(null)
  const [runResult, setRunResult] = useState<Record<number, string>>({})

  useEffect(() => {
    setLoading(true)
    getTactics().then(setTactics).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    const steps = newSteps.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!newName.trim() || steps.length === 0) return
    try {
      const t = await createTactic({ name: newName.trim(), description: newDesc.trim(), steps })
      setTactics((prev) => [...prev, t])
      setNewName('')
      setNewDesc('')
      setNewSteps('')
      setShowNew(false)
    } catch {}
  }

  const handleRun = async (tactic: Tactic) => {
    setRunning(tactic.id)
    try {
      const result = await runTactic(tactic.id)
      setRunResult((prev) => ({ ...prev, [tactic.id]: `Jobs: ${result.job_ids?.join(', ')}` }))
      setTactics((prev) => prev.map((t) => t.id === tactic.id ? { ...t, run_count: t.run_count + 1 } : t))
    } catch {
      setRunResult((prev) => ({ ...prev, [tactic.id]: 'Failed to run' }))
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-2">
        <BookMarked className="w-5 h-5 text-nora-accent" />
        <h1 className="text-lg font-bold text-nora-text">Tactics Library</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="ml-auto flex items-center gap-1.5 text-xs bg-nora-accent text-white px-3 py-1.5 rounded-md hover:bg-nora-accent-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Tactic
        </button>
      </div>

      <p className="text-xs text-nora-muted">
        Save reusable sequences of commands. Run them with <span className="font-mono text-nora-accent">/tactic &lt;name&gt;</span>.
      </p>

      {/* New tactic form */}
      {showNew && (
        <div className="bg-nora-surface border border-nora-accent rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-nora-text">Create New Tactic</h3>
            <button onClick={() => setShowNew(false)} className="text-nora-muted hover:text-nora-text">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            placeholder="Tactic name (e.g. full-stack-app)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-nora-bg border border-nora-border rounded px-3 py-2 text-sm text-nora-text outline-none focus:border-nora-accent"
          />
          <input
            placeholder="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-nora-bg border border-nora-border rounded px-3 py-2 text-sm text-nora-text outline-none focus:border-nora-accent"
          />
          <textarea
            placeholder={`Steps (one per line):\nbuild React frontend\nbuild FastAPI backend\nrun tests`}
            value={newSteps}
            onChange={(e) => setNewSteps(e.target.value)}
            rows={4}
            className="w-full bg-nora-bg border border-nora-border rounded px-3 py-2 text-sm text-nora-text outline-none focus:border-nora-accent font-mono resize-none"
          />
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 text-sm bg-nora-accent text-white px-4 py-2 rounded-md hover:bg-nora-accent-hover transition-colors"
          >
            <Check className="w-4 h-4" /> Save Tactic
          </button>
        </div>
      )}

      {/* Tactics list */}
      {loading && <div className="text-nora-muted animate-pulse text-sm">Loading tactics...</div>}
      <div className="flex-1 overflow-y-auto space-y-3">
        {tactics.length === 0 && !loading && (
          <div className="text-center text-nora-muted py-10">
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tactics yet. Create one to get started.</p>
          </div>
        )}
        {tactics.map((t) => (
          <div key={t.id} className="bg-nora-surface border border-nora-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-nora-accent font-bold">{t.name}</span>
                  <span className="text-xs text-nora-muted">· {t.run_count} runs</span>
                </div>
                <p className="text-sm text-nora-muted mb-2">{t.description}</p>
                <div className="space-y-0.5">
                  {(t.steps as string[]).map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-nora-muted w-4">{i + 1}.</span>
                      <span className="text-nora-text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleRun(t)}
                disabled={running === t.id}
                className="flex items-center gap-1.5 text-xs bg-nora-accent/20 border border-nora-accent text-nora-accent px-3 py-1.5 rounded hover:bg-nora-accent hover:text-white transition-colors disabled:opacity-50 shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                {running === t.id ? 'Running...' : 'Run'}
              </button>
            </div>
            {runResult[t.id] && (
              <div className="mt-2 text-xs font-mono text-nora-success bg-nora-success/10 rounded px-2 py-1">
                ✓ {runResult[t.id]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
