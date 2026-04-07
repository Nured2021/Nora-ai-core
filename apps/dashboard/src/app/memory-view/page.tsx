'use client'

import { useState, useEffect } from 'react'
import { getMemories, searchMemory } from '@/lib/api'
import { MemorySearchResult } from '@/types'
import { Database, Search, Layers, Clock } from 'lucide-react'

const LAYER_PHASE: Record<number, number> = Object.fromEntries([
  ...Array.from({ length: 10 }, (_, i) => [i + 1, 1]),
  ...Array.from({ length: 30 }, (_, i) => [i + 11, 2]),
  ...Array.from({ length: 10 }, (_, i) => [i + 41, 5]),
])

const PHASE_COLORS: Record<number, string> = {
  1: 'text-indigo-400',
  2: 'text-blue-400',
  5: 'text-purple-400',
}

export default function MemoryViewPage() {
  const [memories, setMemories] = useState<MemorySearchResult[]>([])
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null)

  useEffect(() => {
    getMemories().then(setMemories).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleLayerClick = async (layer: number) => {
    setSelectedLayer(layer === selectedLayer ? null : layer)
    setLoading(true)
    try {
      const data = layer === selectedLayer ? await getMemories() : await getMemories(layer)
      setMemories(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setSelectedLayer(null)
    try {
      const data = await searchMemory(query.trim())
      setMemories(data)
    } catch {
    } finally {
      setSearching(false)
    }
  }

  const handleClear = async () => {
    setQuery('')
    setSelectedLayer(null)
    setLoading(true)
    try {
      const data = await getMemories()
      setMemories(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  // Build layer summary from loaded memories
  const layerCounts: Record<number, number> = {}
  for (const m of memories) {
    layerCounts[m.layer] = (layerCounts[m.layer] || 0) + 1
  }

  return (
    <div className="flex h-full p-4 gap-4">
      {/* Left: layer navigator */}
      <div className="w-60 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-nora-accent" />
          <h2 className="text-sm font-bold text-nora-text">MEMORY VIEW</h2>
        </div>
        <p className="text-xs text-nora-muted">50 Brain Connect layers · {memories.length} entries loaded</p>

        {/* Search */}
        <div className="flex gap-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="/memory search…"
            className="flex-1 min-w-0 bg-nora-bg border border-nora-border rounded px-2 py-1.5 text-xs text-nora-text placeholder:text-nora-muted focus:outline-none focus:border-nora-accent"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-2 py-1.5 bg-nora-accent rounded text-xs text-white hover:bg-nora-accent/90 disabled:opacity-50"
          >
            <Search className="w-3 h-3" />
          </button>
        </div>
        {query && (
          <button onClick={handleClear} className="text-xs text-nora-muted hover:text-nora-text text-left">
            ← Clear search
          </button>
        )}

        {/* Layer list — grouped by phase */}
        <div className="overflow-y-auto space-y-3 flex-1">
          {[
            { label: 'Phase 1 — Layers 1–10', layers: Array.from({ length: 10 }, (_, i) => i + 1) },
            { label: 'Phase 2-4 — Layers 11–40', layers: Array.from({ length: 30 }, (_, i) => i + 11) },
            { label: 'Phase 5 — Layers 41–50', layers: Array.from({ length: 10 }, (_, i) => i + 41) },
          ].map(({ label, layers }) => (
            <div key={label}>
              <div className="text-xs text-nora-muted font-medium mb-1 px-1">{label}</div>
              {layers.map((layer) => (
                <button
                  key={layer}
                  onClick={() => handleLayerClick(layer)}
                  className={`w-full text-left px-2 py-1 rounded border transition-colors flex items-center gap-2 mb-0.5 ${
                    selectedLayer === layer
                      ? 'border-nora-accent bg-nora-accent/10 text-nora-text'
                      : 'border-transparent text-nora-muted hover:border-nora-border hover:text-nora-text'
                  }`}
                >
                  <span className={`text-xs font-mono w-5 shrink-0 ${PHASE_COLORS[LAYER_PHASE[layer]] || 'text-nora-accent'}`}>
                    {layer}
                  </span>
                  <span className="text-xs truncate flex-1">Layer {layer}</span>
                  {layerCounts[layer] ? (
                    <span className="text-xs text-nora-muted shrink-0">{layerCounts[layer]}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right: memory entries */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-nora-muted" />
          <span className="text-sm font-medium text-nora-text">
            {selectedLayer ? `Layer ${selectedLayer}` : query ? `Search: "${query}"` : 'All Memory Entries'}
          </span>
          <span className="text-xs text-nora-muted ml-auto">{memories.length} entries</span>
        </div>

        <div className="flex-1 overflow-y-auto bg-nora-surface border border-nora-border rounded-lg p-3 font-mono text-xs space-y-2">
          {(loading || searching) && (
            <div className="text-nora-muted animate-pulse">Loading memories...</div>
          )}
          {!loading && !searching && memories.length === 0 && (
            <div className="text-nora-muted italic">
              {query ? `No memories matching "${query}"` : 'No memories stored yet. Start issuing commands.'}
            </div>
          )}
          {!loading && !searching && memories.map((m) => (
            <div key={m.id} className="border border-nora-border rounded p-2 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold ${PHASE_COLORS[LAYER_PHASE[m.layer]] || 'text-nora-accent'}`}>
                  L{m.layer}
                </span>
                <span className="text-nora-muted">{m.layer_name}</span>
                <span className="ml-auto flex items-center gap-1 text-nora-muted">
                  <Clock className="w-3 h-3" />
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-nora-muted">
                key: <span className="text-nora-text">{m.key}</span>
              </div>
              <div className="text-nora-muted">
                value: <span className="text-nora-text break-all">{m.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
