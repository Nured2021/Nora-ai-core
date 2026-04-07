'use client'

import { useState, useRef, useEffect } from 'react'
import { sendCommand } from '@/lib/api'
import { Send, Terminal } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onResult?: (result: Record<string, unknown>) => void
  fillValue?: string
}

const HELP_TEXT = `
NORA Pilot Commands:
  /build <description>   — Start building a project
  /status [job_id]       — Check job status
  /stop <job_id>         — Cancel a running job
  /deploy <target>       — Deploy (requires HumanLoop approval)
  /tactic <name>         — Run a saved tactic

Or just type naturally:
  "build a todo app with React"
  "create a REST API with FastAPI"
`.trim()

export function CommandInput({ onResult, fillValue }: Props) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fill input when parent passes a fillValue (e.g. example chip click)
  useEffect(() => {
    if (fillValue) {
      setValue(fillValue)
      inputRef.current?.focus()
    }
  }, [fillValue])

  const submit = async () => {
    const text = value.trim()
    if (!text) return
    setLoading(true)
    setHistory((h) => [text, ...h.slice(0, 49)])
    setHistIdx(-1)
    setValue('')
    try {
      const result = await sendCommand(text)
      onResult?.(result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Command failed'
      onResult?.({ type: 'error', message: msg })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(next)
      setValue(history[next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(histIdx - 1, -1)
      setHistIdx(next)
      setValue(next === -1 ? '' : history[next])
    }
  }

  return (
    <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-4 h-4 text-nora-accent" />
        <span className="text-sm font-medium text-nora-text">NORA Pilot Command</span>
        <span className="text-xs text-nora-muted ml-auto">↑↓ history • Enter to run</span>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-1 text-nora-accent font-mono text-sm">
          <span>&gt;</span>
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='build me a CRM with chat, or /deploy to production'
          disabled={loading}
          className={clsx(
            'flex-1 bg-transparent text-nora-text font-mono text-sm outline-none',
            'placeholder:text-nora-muted',
            loading && 'opacity-50'
          )}
        />
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className={clsx(
            'p-1.5 rounded transition-colors',
            value.trim() && !loading
              ? 'text-nora-accent hover:text-white hover:bg-nora-accent'
              : 'text-nora-muted cursor-not-allowed'
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      {loading && (
        <div className="mt-2 text-xs text-nora-accent font-mono animate-pulse">
          NORA is processing...
        </div>
      )}
    </div>
  )
}
