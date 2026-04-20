'use client'

import { useAuthStore } from '@/lib/auth-store'
import { Settings, User, Shield, Zap, Server } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-nora-accent" />
        <h1 className="text-lg font-bold text-nora-text">Settings</h1>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {/* Profile */}
        <section className="bg-nora-surface border border-nora-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-nora-muted" />
            <h2 className="text-sm font-bold text-nora-text">Profile</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Username" value={user?.username || '—'} mono />
            <Row label="Email" value={user?.email || '—'} />
            <Row label="Workspace" value={user?.workspace || '—'} />
            <Row label="Account active" value={user?.is_active ? 'Yes' : 'No'} />
            <Row label="Member since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'} />
          </div>
        </section>

        {/* Role & Permissions */}
        <section className="bg-nora-surface border border-nora-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-nora-muted" />
            <h2 className="text-sm font-bold text-nora-text">Role & Permissions</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Role" value={user?.role || '—'} mono highlight />
          </div>
          <div className="mt-3 text-xs text-nora-muted space-y-1">
            <PermRow role={user?.role} allowed={['ADMIN', 'DEVELOPER', 'VIEWER']} perm="View jobs and logs" />
            <PermRow role={user?.role} allowed={['ADMIN', 'DEVELOPER']} perm="Submit build commands" />
            <PermRow role={user?.role} allowed={['ADMIN', 'DEVELOPER']} perm="Approve HumanLoop actions" />
            <PermRow role={user?.role} allowed={['ADMIN']} perm="Manage users" />
            <PermRow role={user?.role} allowed={['ADMIN']} perm="Access all workspaces" />
          </div>
        </section>

        {/* System info */}
        <section className="bg-nora-surface border border-nora-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-nora-muted" />
            <h2 className="text-sm font-bold text-nora-text">System</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="NORA Version" value="1.0.0 (Phase 1)" mono />
            <Row label="API" value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'} mono />
            <Row label="WebSocket" value={process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'} mono />
            <Row label="Queue" value="Redis + Celery (No-Stop)" />
            <Row label="Database" value="PostgreSQL" />
          </div>
        </section>

        {/* NORA modules */}
        <section className="bg-nora-surface border border-nora-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-nora-muted" />
            <h2 className="text-sm font-bold text-nora-text">Active Modules (Phase 1)</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              ['NORA-CMD', 'Pilot commands'],
              ['NORA-CHAT', 'Conversation'],
              ['NORA-CODE', 'Code generation'],
              ['NORA-ARCH', 'System design'],
              ['NORA-DEPLOY', 'Deployment'],
              ['NORA-TEST', 'Test runner'],
              ['NORA-BRAIN', 'Memory'],
              ['NORA-HUMAN', 'HumanLoop'],
              ['NORA-OPS', 'Job monitoring'],
              ['NORA-BUILDER', 'App builder'],
            ].map(([name, desc]) => (
              <div key={name} className="flex items-center gap-2 text-nora-muted">
                <span className="w-2 h-2 rounded-full bg-nora-success shrink-0" />
                <span className="text-nora-accent">{name}</span>
                <span className="truncate">{desc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Row({ label, value, mono = false, highlight = false }: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-nora-muted">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${highlight ? 'text-nora-accent font-bold' : 'text-nora-text'}`}>
        {value}
      </span>
    </div>
  )
}

function PermRow({ role, allowed, perm }: { role?: string; allowed: string[]; perm: string }) {
  const has = role && allowed.includes(role)
  return (
    <div className="flex items-center gap-2">
      <span className={has ? 'text-nora-success' : 'text-nora-error'}>{has ? '✓' : '✗'}</span>
      <span className={has ? 'text-nora-text' : 'text-nora-muted line-through'}>{perm}</span>
    </div>
  )
}
