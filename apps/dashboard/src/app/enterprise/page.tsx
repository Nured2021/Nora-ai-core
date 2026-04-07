'use client'

import { useState, useEffect } from 'react'
import {
  getOrganizations, createOrganization,
  getWorkspaces, createWorkspace,
  getTeamMembers, inviteTeamMember,
  getAuditLog, sendCommand,
} from '@/lib/api'
import { Organization, WorkspaceRecord, TeamMemberRecord, AuditLogEntry } from '@/types'
import {
  Building2, FolderOpen, Users, Shield, Terminal,
  Plus, Activity, RefreshCw,
} from 'lucide-react'

export default function EnterprisePage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([])
  const [team, setTeam] = useState<TeamMemberRecord[]>([])
  const [audit, setAudit] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [cmdInput, setCmdInput] = useState('')
  const [cmdResult, setCmdResult] = useState<string | null>(null)
  const [cmdRunning, setCmdRunning] = useState(false)

  // Create org form
  const [orgName, setOrgName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    try {
      const [o, w, t, a] = await Promise.all([
        getOrganizations().catch(() => []),
        getWorkspaces().catch(() => []),
        getTeamMembers().catch(() => []),
        getAuditLog(20).catch(() => []),
      ])
      setOrgs(o)
      setWorkspaces(w)
      setTeam(t)
      setAudit(a)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return
    setCreating(true)
    try {
      const slug = orgName.toLowerCase().replace(/\s+/g, '-')
      await createOrganization(orgName.trim(), slug)
      setOrgName('')
      await load()
    } catch {
    } finally {
      setCreating(false)
    }
  }

  const handleCommand = async () => {
    if (!cmdInput.trim()) return
    setCmdRunning(true)
    setCmdResult(null)
    try {
      const res = await sendCommand(cmdInput.trim())
      setCmdResult(JSON.stringify(res, null, 2))
      await load()
    } catch (e: unknown) {
      setCmdResult(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setCmdRunning(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-nora-accent flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-nora-text">Enterprise Command Center</h1>
          <p className="text-xs text-nora-muted">Phase 6 · Organizations · Workspaces · Team · Audit</p>
        </div>
        <button onClick={load} className="text-nora-muted hover:text-nora-text transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Building2 className="w-4 h-4" />} label="Organizations" value={orgs.length} />
        <StatCard icon={<FolderOpen className="w-4 h-4" />} label="Workspaces"    value={workspaces.length} />
        <StatCard icon={<Users className="w-4 h-4" />}     label="Team Members"  value={team.length} />
        <StatCard icon={<Shield className="w-4 h-4" />}    label="Audit Events"  value={audit.length} />
      </div>

      <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">
        {/* Left: Command runner + create org */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
          {/* Enterprise command runner */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-nora-accent" />
              <span className="text-sm font-bold text-nora-text">Enterprise Commands</span>
            </div>
            <input
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !cmdRunning && handleCommand()}
              placeholder="/org create my-org"
              className="w-full bg-nora-bg border border-nora-border rounded px-3 py-2 text-sm text-nora-text placeholder:text-nora-muted focus:outline-none focus:border-nora-accent mb-2"
            />
            <button
              onClick={handleCommand}
              disabled={cmdRunning || !cmdInput.trim()}
              className="w-full py-2 rounded text-sm font-bold bg-nora-accent hover:bg-nora-accent/80 text-white transition-all disabled:opacity-50"
            >
              {cmdRunning ? 'Running...' : 'Execute'}
            </button>
            {cmdResult && (
              <pre className="mt-3 text-xs text-nora-muted bg-nora-bg rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {cmdResult}
              </pre>
            )}
          </div>

          {/* Create organization */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-nora-muted" />
              <span className="text-sm font-bold text-nora-text">Create Organization</span>
            </div>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreateOrg()}
              placeholder="My Company"
              className="w-full bg-nora-bg border border-nora-border rounded px-3 py-2 text-sm text-nora-text placeholder:text-nora-muted focus:outline-none focus:border-nora-accent mb-2"
            />
            <button
              onClick={handleCreateOrg}
              disabled={creating || !orgName.trim()}
              className="w-full py-2 rounded text-sm font-medium bg-nora-border hover:bg-nora-accent/20 text-nora-text transition-all disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Org'}
            </button>
          </div>

          {/* Quick command reference */}
          <div className="bg-nora-surface border border-nora-border rounded-lg p-3 text-xs text-nora-muted space-y-1">
            <div className="font-medium text-nora-text mb-2">Phase 6 Commands</div>
            {['/org create', '/workspace create', '/team invite', '/approve queue',
              '/promote staging', '/backup run', '/restore latest', '/health full', '/analytics dashboard'
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => setCmdInput(cmd)}
                className="block w-full text-left font-mono bg-nora-bg px-2 py-1 rounded hover:bg-nora-accent/10 hover:text-nora-text transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* Right: orgs + workspaces + audit */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
          {/* Organizations */}
          <Section title="Organizations" icon={<Building2 className="w-4 h-4" />} count={orgs.length}>
            {loading ? (
              <div className="text-xs text-nora-muted animate-pulse">Loading...</div>
            ) : orgs.length === 0 ? (
              <div className="text-xs text-nora-muted italic">No organizations yet. Use /org create or the form above.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {orgs.map((org) => (
                  <div key={org.id} className="bg-nora-bg border border-nora-border rounded p-3">
                    <div className="text-sm font-medium text-nora-text">{org.name}</div>
                    <div className="text-xs text-nora-muted mt-0.5">{org.slug} · {org.plan}</div>
                    <div className={`text-xs mt-1 ${org.active ? 'text-green-400' : 'text-nora-muted'}`}>
                      {org.active ? '● Active' : '○ Inactive'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Workspaces */}
          <Section title="Workspaces" icon={<FolderOpen className="w-4 h-4" />} count={workspaces.length}>
            {loading ? (
              <div className="text-xs text-nora-muted animate-pulse">Loading...</div>
            ) : workspaces.length === 0 ? (
              <div className="text-xs text-nora-muted italic">No workspaces. Use /workspace create &lt;name&gt;</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="bg-nora-bg border border-nora-border rounded p-3">
                    <div className="text-sm font-medium text-nora-text">{ws.name}</div>
                    <div className="text-xs text-nora-muted mt-0.5">{ws.slug}</div>
                    {ws.description && (
                      <div className="text-xs text-nora-muted mt-1 truncate">{ws.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Recent Audit Events */}
          <Section title="Audit Trail" icon={<Activity className="w-4 h-4" />} count={audit.length}>
            {loading ? (
              <div className="text-xs text-nora-muted animate-pulse">Loading...</div>
            ) : audit.length === 0 ? (
              <div className="text-xs text-nora-muted italic">No audit events yet.</div>
            ) : (
              <div className="space-y-1">
                {audit.slice(0, 15).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 text-xs py-1.5 border-b border-nora-border/50 last:border-0">
                    <span className={`shrink-0 font-mono px-1.5 py-0.5 rounded text-xs ${
                      entry.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-nora-error/10 text-nora-error'
                    }`}>{entry.action}</span>
                    <span className="text-nora-muted flex-1 truncate">{entry.details || entry.resource_id}</span>
                    <span className="text-nora-muted shrink-0">{new Date(entry.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-nora-surface border border-nora-border rounded-lg p-4 flex items-center gap-3">
      <span className="text-nora-accent">{icon}</span>
      <div>
        <div className="text-xl font-bold text-nora-text">{value}</div>
        <div className="text-xs text-nora-muted">{label}</div>
      </div>
    </div>
  )
}

function Section({ title, icon, count, children }: {
  title: string; icon: React.ReactNode; count: number; children: React.ReactNode
}) {
  return (
    <div className="bg-nora-surface border border-nora-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-nora-muted">{icon}</span>
        <span className="text-sm font-bold text-nora-text">{title}</span>
        <span className="text-xs text-nora-muted bg-nora-bg px-1.5 py-0.5 rounded ml-auto">{count}</span>
      </div>
      {children}
    </div>
  )
}
