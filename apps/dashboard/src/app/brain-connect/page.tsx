'use client'

import { useState, useEffect } from 'react'
import { getBrainLayers, getMemories } from '@/lib/api'
import { Brain, Database, Layers, Clock } from 'lucide-react'

interface Memory {
  id: number
  user_id: number
  layer: number
  layer_name: string
  key: string
  value: string
  created_at: string
}

const LAYER_DESCRIPTIONS: Record<string, string> = {
  '1': 'Stores all commands issued by the user',
  '2': 'Recognizes patterns in generated code',
  '3': 'Learns user build preferences over time',
  '4': 'Tracks all job and system states',
  '5': 'Stores all HumanLoop approvals and rejections',
  '6': 'Remembers deployment targets and configs',
  '7': 'Logs errors and successful recovery actions',
  '8': 'Maps users to roles and workspaces',
  '9': 'Library of reusable builder templates',
  '10': 'Real-time feedback loop for live status',
}

export default function BrainConnectPage() {
  const [layers, setLayers] = useState<Record<string, string>>({})
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getBrainLayers().then((data) => setLayers(data.layers || {})).catch(() => {})
    getMemories().then(setMemories).catch(() => {})
  }, [])

  const handleLayerClick = async (layer: number) => {
    setSelectedLayer(layer)
    setLoading(true)
    try {
      const mems = await getMemories(layer)
      setMemories(mems)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleShowAll = async () => {
    setSelectedLayer(null)
    setLoading(true)
    try {
      const mems = await getMemories()
      setMemories(mems)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full p-4 gap-4">
      {/* Layer list */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-nora-accent" />
          <h2 className="text-sm font-bold text-nora-text">BRAIN CONNECT</h2>
        </div>
        <p className="text-xs text-nora-muted">10 active layers (scales to 50 in future phases)</p>

        <button
          onClick={handleShowAll}
          className={`text-left px-3 py-2 rounded-md text-sm border transition-colors ${
            selectedLayer === null
              ? 'border-nora-accent bg-nora-accent/10 text-nora-text'
              : 'border-nora-border text-nora-muted hover:border-nora-accent/50'
          }`}
        >
          All Layers
        </button>

        <div className="space-y-1 overflow-y-auto">
          {Object.entries(layers).map(([num, name]) => (
            <button
              key={num}
              onClick={() => handleLayerClick(Number(num))}
              className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                selectedLayer === Number(num)
                  ? 'border-nora-accent bg-nora-accent/10 text-nora-text'
                  : 'border-nora-border text-nora-muted hover:border-nora-accent/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-nora-accent w-5">#{num}</span>
                <span className="text-xs">{name}</span>
              </div>
              <p className="text-xs text-nora-muted mt-0.5 truncate ml-7">
                {LAYER_DESCRIPTIONS[num] || ''}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Memory entries */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-nora-muted" />
          <span className="text-sm font-medium text-nora-text">
            {selectedLayer ? `Layer ${selectedLayer} — ${layers[String(selectedLayer)]}` : 'All Memory Entries'}
          </span>
          <span className="text-xs text-nora-muted ml-auto">{memories.length} entries</span>
        </div>

        <div className="flex-1 overflow-y-auto bg-nora-surface border border-nora-border rounded-lg p-3 font-mono text-xs space-y-2">
          {loading && <div className="text-nora-muted animate-pulse">Loading memories...</div>}
          {!loading && memories.length === 0 && (
            <div className="text-nora-muted italic">No memories stored yet. Start issuing commands.</div>
          )}
          {!loading && memories.map((m) => (
            <div key={m.id} className="border border-nora-border rounded p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-nora-accent">L{m.layer}</span>
                <span className="text-nora-muted">{m.layer_name}</span>
                <span className="ml-auto flex items-center gap-1 text-nora-muted">
                  <Clock className="w-3 h-3" />
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-nora-muted">key: <span className="text-nora-text">{m.key}</span></div>
              <div className="text-nora-muted">value: <span className="text-nora-text break-all">{m.value}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
