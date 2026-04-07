'use client'

import { useState, useEffect } from 'react'
import { getPendingApprovals, decideApproval, getAuditLog } from '@/lib/api'
import { ApprovalRequest, AuditLogEntry } from '@/types'
import { CheckCircle, XCircle, Clock, Shield, RefreshCw } from 'lucide-react'

export default function ApprovalsCenterPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [audit, setAudit] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = async () => {
    try {
      const [a, al] = await Promise.all([
        getPendingApprovals().catch(() => []),
        getAuditLog(30).catch(() => []),
      ])
      setApprovals(a)
      setAudit(al)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const decide = async (requestId: string, decision: 'approved' | 'rejected') => {
    setDeciding(requestId)
    try {
      await decideApproval(requestId, decision, notes[requestId])
      await load()
    } catch {
    } finally {
      setDeciding(null)
    }
  }

  const STATUS_COLOR: Record<string, string> = {
    pending: 'text-yellow-400',
    approved: 'text-green-400',
    rejected: 'text-nora-error',
    modified: 'text-nora-accent',
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-nora-accent flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-nora-text">Approvals Center</h1>
          <p className="text-xs text-nora-muted">Phase 6 · Advanced approvals matrix · Audit trail center</p>
        </div>
        <button onClick={load} className="text-nora-muted hover:text-nora-text transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-nora-surface border border-nora-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{approvals.filter(a => a.status === 'pending').length}</div>
          <div className="text-xs text-nora-muted mt-0.5">Pending</div>
        </div>
        <div className="bg-nora-surface border border-nora-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{approvals.filter(a => a.status === 'approved').length}</div>
          <div className="text-xs text-nora-muted mt-0.5">Approved</div>
        </div>
        <div className="bg-nora-surface border border-nora-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-nora-error">{approvals.filter(a => a.status === 'rejected').length}</div>
          <div className="text-xs text-nora-muted mt-0.5">Rejected</div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">
        {/* Pending approvals */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="bg-nora-surface border border-nora-border rounded-lg p-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-nora-text">Approval Queue</span>
            </div>
            {loading ? (
              <div className="text-xs text-nora-muted animate-pulse">Loading...</div>
            ) : approvals.length === 0 ? (
              <div className="text-xs text-nora-muted italic">
                No approval requests. Use /deploy or /approve queue to see items here.
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map((req) => (
                  <div
                    key={req.request_id}
                    className={`bg-nora-bg border rounded-lg p-4 transition-all ${
                      req.status === 'pending' ? 'border-yellow-500/40' : 'border-nora-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-sm font-medium text-nora-text">{req.action}</div>
                        <div className="text-xs text-nora-muted font-mono">{req.request_id}</div>
                      </div>
                      <span className={`text-xs font-bold ${STATUS_COLOR[req.status] || 'text-nora-muted'}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    {req.details && (
                      <div className="text-xs text-nora-muted mb-3 bg-nora-surface rounded p-2 truncate">
                        {req.details}
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <input
                          value={notes[req.request_id] || ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [req.request_id]: e.target.value }))}
                          placeholder="Optional note..."
                          className="w-full bg-nora-surface border border-nora-border rounded px-2 py-1 text-xs text-nora-text placeholder:text-nora-muted focus:outline-none focus:border-nora-accent"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => decide(req.request_id, 'approved')}
                            disabled={deciding === req.request_id}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => decide(req.request_id, 'rejected')}
                            disabled={deciding === req.request_id}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold bg-nora-error hover:bg-nora-error/80 text-white transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {req.decision_note && (
                      <div className="text-xs text-nora-muted mt-2 italic">Note: {req.decision_note}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Audit trail */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3">
          <div className="bg-nora-surface border border-nora-border rounded-lg p-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-nora-muted" />
              <span className="text-sm font-bold text-nora-text">Audit Trail</span>
              <span className="text-xs text-nora-muted bg-nora-bg px-1.5 py-0.5 rounded ml-auto">{audit.length}</span>
            </div>
            {audit.length === 0 ? (
              <div className="text-xs text-nora-muted italic">No audit events yet.</div>
            ) : (
              <div className="space-y-1">
                {audit.map((entry) => (
                  <div key={entry.id} className="text-xs py-1.5 border-b border-nora-border/50 last:border-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold font-mono ${entry.status === 'success' ? 'text-green-400' : 'text-nora-error'}`}>
                        {entry.action}
                      </span>
                      <span className="text-nora-muted ml-auto">{new Date(entry.created_at).toLocaleTimeString()}</span>
                    </div>
                    {entry.details && (
                      <div className="text-nora-muted truncate">{entry.details}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
