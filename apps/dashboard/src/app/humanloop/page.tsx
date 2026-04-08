'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingApprovals, decideApproval } from '@/lib/api'
import { ApprovalRequest } from '@/types'
import { useGlobalFeed } from '@/hooks/useWebSocket'
import { useAuthStore } from '@/lib/auth-store'
import { WsMessage } from '@/types'
import { UserCheck, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react'

export default function HumanLoopPage() {
  const { user } = useAuthStore()
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState<Record<string, string>>({})
  const [deciding, setDeciding] = useState<string | null>(null)

  const canDecide = user?.role === 'ADMIN' || user?.role === 'DEVELOPER'

  const fetchApprovals = useCallback(() => {
    if (!canDecide) return
    setLoading(true)
    getPendingApprovals().then(setApprovals).catch(() => {}).finally(() => setLoading(false))
  }, [canDecide])

  useEffect(() => { fetchApprovals() }, [fetchApprovals])

  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type === 'approval_required') {
      fetchApprovals()
    }
  }, [fetchApprovals])

  useGlobalFeed(handleWs)

  const decide = async (requestId: string, decision: 'approved' | 'rejected' | 'modified') => {
    setDeciding(requestId)
    try {
      await decideApproval(requestId, decision, note[requestId])
      setApprovals((prev) => prev.filter((a) => a.request_id !== requestId))
    } catch (err) {
      console.error(err)
    } finally {
      setDeciding(null)
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-nora-accent" />
        <h1 className="text-lg font-bold text-nora-text">HumanLoop Approval Gate</h1>
        <button onClick={fetchApprovals} className="ml-auto text-nora-muted hover:text-nora-text">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-nora-surface border border-nora-border rounded-lg p-3 text-xs text-nora-muted">
        <strong className="text-nora-text">HumanLoop</strong> — Critical actions (e.g. /deploy) are gated here.
        ADMIN and DEVELOPER roles can approve, reject, or modify.
        {!canDecide && <span className="text-nora-warning ml-2"> Your role ({user?.role}) is read-only.</span>}
      </div>

      {approvals.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-nora-muted">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-nora-success opacity-50" />
            <p className="text-sm">No pending approvals.</p>
            <p className="text-xs mt-1">Run <span className="font-mono text-nora-accent">/deploy to production</span> to trigger a request.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto flex-1">
          {approvals.map((req) => (
            <div
              key={req.request_id}
              className="bg-nora-surface border border-nora-warning rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-nora-warning shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-nora-warning">{req.action}</span>
                    <span className="text-xs font-mono text-nora-muted">{req.request_id}</span>
                    {req.job_id && <span className="text-xs font-mono text-nora-accent">{req.job_id}</span>}
                  </div>
                  <p className="text-sm text-nora-text">{req.details}</p>
                  <p className="text-xs text-nora-muted mt-1">
                    Requested: {new Date(req.created_at).toLocaleString()}
                    {req.expires_at && ` · Expires: ${new Date(req.expires_at).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-nora-warning" />
                  <span className="text-xs text-nora-warning">PENDING</span>
                </div>
              </div>

              {canDecide && (
                <>
                  <input
                    type="text"
                    placeholder="Optional note..."
                    value={note[req.request_id] || ''}
                    onChange={(e) => setNote((prev) => ({ ...prev, [req.request_id]: e.target.value }))}
                    className="w-full bg-nora-bg border border-nora-border rounded px-3 py-1.5 text-sm text-nora-text outline-none focus:border-nora-accent transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide(req.request_id, 'approved')}
                      disabled={deciding === req.request_id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-nora-success/20 border border-nora-success text-nora-success rounded-md text-sm hover:bg-nora-success hover:text-white transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => decide(req.request_id, 'modified')}
                      disabled={deciding === req.request_id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-nora-warning/20 border border-nora-warning text-nora-warning rounded-md text-sm hover:bg-nora-warning hover:text-white transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4" /> Modify
                    </button>
                    <button
                      onClick={() => decide(req.request_id, 'rejected')}
                      disabled={deciding === req.request_id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-nora-error/20 border border-nora-error text-nora-error rounded-md text-sm hover:bg-nora-error hover:text-white transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
