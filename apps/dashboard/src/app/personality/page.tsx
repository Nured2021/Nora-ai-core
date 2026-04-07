'use client'

import { useState, useEffect } from 'react'
import { getPersonality, setPersonalityTrait, sendCommand } from '@/lib/api'
import { PersonalityTrait } from '@/types'
import { Sparkles, Plus, Check, Zap } from 'lucide-react'

const PRESET_TRAITS = [
  { trait: 'tone',      options: ['friendly', 'professional', 'concise', 'verbose', 'playful'] },
  { trait: 'style',     options: ['technical', 'simple', 'detailed', 'minimal'] },
  { trait: 'language',  options: ['english', 'formal', 'casual', 'expert'] },
  { trait: 'creativity', options: ['high', 'medium', 'low', 'maximum'] },
  { trait: 'speed',     options: ['fast', 'thorough', 'balanced'] },
]

export default function PersonalityPage() {
  const [traits, setTraits] = useState<PersonalityTrait[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [customTrait, setCustomTrait] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [cmdResult, setCmdResult] = useState('')

  useEffect(() => {
    getPersonality()
      .then(setTraits)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSet = async (trait: string, value: string) => {
    setSaving(`${trait}:${value}`)
    try {
      const updated = await setPersonalityTrait(trait, value)
      setTraits((prev) => {
        const idx = prev.findIndex((t) => t.trait === trait)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [...prev, updated]
      })
      setSaved(`${trait}:${value}`)
      setTimeout(() => setSaved(null), 2000)
    } catch {
    } finally {
      setSaving(null)
    }
  }

  const handleCustom = async () => {
    if (!customTrait.trim() || !customValue.trim()) return
    await handleSet(customTrait.trim().toLowerCase(), customValue.trim())
    setCustomTrait('')
    setCustomValue('')
  }

  const handleCommand = async () => {
    try {
      const res = await sendCommand('/personality set tone friendly')
      setCmdResult(JSON.stringify(res, null, 2))
    } catch (e: any) {
      setCmdResult(e.message)
    }
  }

  const getTraitValue = (trait: string) =>
    traits.find((t) => t.trait === trait)?.value || null

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-nora-accent" />
        <div>
          <h1 className="text-lg font-bold text-nora-text">PERSONALITY CONTROL</h1>
          <p className="text-xs text-nora-muted">
            NORA-SOUL · {traits.length} traits active · use <code className="bg-nora-border px-1 rounded">/personality set &lt;trait&gt; &lt;value&gt;</code>
          </p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">
        {/* Preset trait panels */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {PRESET_TRAITS.map(({ trait, options }) => {
            const current = getTraitValue(trait)
            return (
              <div key={trait} className="bg-nora-surface border border-nora-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-nora-text uppercase tracking-wide">{trait}</span>
                  {current && (
                    <span className="text-xs bg-nora-accent/20 text-nora-accent px-2 py-0.5 rounded font-mono">
                      {current}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {options.map((opt) => {
                    const isActive = current === opt
                    const isSaving = saving === `${trait}:${opt}`
                    const isSaved = saved === `${trait}:${opt}`
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSet(trait, opt)}
                        disabled={!!saving}
                        className={`px-3 py-1.5 rounded text-xs border transition-all ${
                          isActive
                            ? 'border-nora-accent bg-nora-accent text-white'
                            : 'border-nora-border text-nora-muted hover:border-nora-accent/60 hover:text-nora-text'
                        } disabled:opacity-50`}
                      >
                        {isSaving ? '...' : isSaved ? <Check className="w-3 h-3 inline" /> : opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Custom trait */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-nora-muted" />
              <span className="text-sm font-bold text-nora-text">Custom Trait</span>
            </div>
            <div className="flex gap-2">
              <input
                value={customTrait}
                onChange={(e) => setCustomTrait(e.target.value)}
                placeholder="trait name"
                className="flex-1 bg-nora-bg border border-nora-border rounded px-2 py-1.5 text-xs text-nora-text placeholder:text-nora-muted focus:outline-none focus:border-nora-accent"
              />
              <input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustom()}
                placeholder="value"
                className="flex-1 bg-nora-bg border border-nora-border rounded px-2 py-1.5 text-xs text-nora-text placeholder:text-nora-muted focus:outline-none focus:border-nora-accent"
              />
              <button
                onClick={handleCustom}
                disabled={!customTrait.trim() || !customValue.trim() || !!saving}
                className="px-3 py-1.5 bg-nora-accent text-white rounded text-xs hover:bg-nora-accent/90 disabled:opacity-40"
              >
                Set
              </button>
            </div>
          </div>
        </div>

        {/* Active traits panel */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3">
          <div className="bg-nora-surface border border-nora-border rounded-lg p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-nora-accent" />
              <span className="text-sm font-bold text-nora-text">Active Traits</span>
              <span className="text-xs text-nora-muted ml-auto">{traits.length}</span>
            </div>

            {loading && <div className="text-xs text-nora-muted animate-pulse">Loading...</div>}
            {!loading && traits.length === 0 && (
              <div className="text-xs text-nora-muted italic">
                No traits set yet. Use presets above or type{' '}
                <code className="bg-nora-border px-1 rounded">/personality set tone friendly</code>
              </div>
            )}
            <div className="space-y-2 overflow-y-auto flex-1">
              {traits.map((t) => (
                <div key={t.id} className="flex items-center justify-between border border-nora-border rounded px-2 py-1.5">
                  <span className="text-xs text-nora-muted font-mono">{t.trait}</span>
                  <span className="text-xs text-nora-accent font-medium">{t.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Command hint */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-3">
            <div className="text-xs text-nora-muted space-y-1">
              <div className="font-medium text-nora-text mb-2">Commands</div>
              <div className="font-mono bg-nora-bg px-2 py-1 rounded">/personality set tone friendly</div>
              <div className="font-mono bg-nora-bg px-2 py-1 rounded">/personality set style technical</div>
              <div className="font-mono bg-nora-bg px-2 py-1 rounded">/personality set creativity high</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
