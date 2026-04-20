'use client'

import { useState, useEffect } from 'react'
import { getUsers, updateUser } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { Users, Shield, Edit2, Check, X } from 'lucide-react'
import clsx from 'clsx'

interface UserEntry {
  id: number
  username: string
  email: string
  role: string
  workspace: string
  is_active: boolean
  created_at: string
}

const ROLES = ['ADMIN', 'DEVELOPER', 'VIEWER']
const WORKSPACES = ['WorkspaceA', 'WorkspaceB', 'WorkspaceC']

const roleColor: Record<string, string> = {
  ADMIN: 'text-nora-error border-nora-error',
  DEVELOPER: 'text-nora-accent border-nora-accent',
  VIEWER: 'text-nora-muted border-nora-muted',
}

export default function MultiUserPage() {
  const { user: me } = useAuthStore()
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<UserEntry>>({})

  const isAdmin = me?.role === 'ADMIN'

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    getUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false))
  }, [isAdmin])

  const startEdit = (u: UserEntry) => {
    setEditing(u.id)
    setEditData({ role: u.role, workspace: u.workspace, is_active: u.is_active })
  }

  const saveEdit = async (id: number) => {
    try {
      const updated = await updateUser(id, editData)
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...updated } : u))
    } catch {}
    setEditing(null)
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-nora-accent" />
        <h1 className="text-lg font-bold text-nora-text">Multi-User Management</h1>
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { role: 'ADMIN', desc: 'Full access, approve deployments, manage users', color: 'border-nora-error' },
          { role: 'DEVELOPER', desc: 'Build, deploy with approval, view all jobs', color: 'border-nora-accent' },
          { role: 'VIEWER', desc: 'Read-only, view jobs and logs', color: 'border-nora-muted' },
        ].map(({ role, desc, color }) => (
          <div key={role} className={`bg-nora-surface border ${color} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-nora-muted" />
              <span className="text-sm font-bold text-nora-text">{role}</span>
            </div>
            <p className="text-xs text-nora-muted">{desc}</p>
          </div>
        ))}
      </div>

      {!isAdmin ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-nora-muted">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Admin access required to manage users.</p>
            <p className="text-xs mt-1">You are logged in as <span className="text-nora-accent">{me?.role}</span></p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-nora-muted animate-pulse text-sm">Loading users...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-nora-muted border-b border-nora-border">
                  <th className="text-left pb-2 pr-4">Username</th>
                  <th className="text-left pb-2 pr-4">Email</th>
                  <th className="text-left pb-2 pr-4">Role</th>
                  <th className="text-left pb-2 pr-4">Workspace</th>
                  <th className="text-left pb-2 pr-4">Status</th>
                  <th className="text-left pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nora-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-nora-surface/50">
                    <td className="py-2 pr-4 font-mono text-nora-text">{u.username}</td>
                    <td className="py-2 pr-4 text-nora-muted">{u.email}</td>
                    <td className="py-2 pr-4">
                      {editing === u.id ? (
                        <select
                          value={editData.role}
                          onChange={(e) => setEditData((d) => ({ ...d, role: e.target.value }))}
                          className="bg-nora-bg border border-nora-border rounded px-2 py-1 text-xs text-nora-text"
                        >
                          {ROLES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span className={clsx('text-xs font-mono border rounded px-1.5 py-0.5', roleColor[u.role] || 'text-nora-muted')}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editing === u.id ? (
                        <select
                          value={editData.workspace}
                          onChange={(e) => setEditData((d) => ({ ...d, workspace: e.target.value }))}
                          className="bg-nora-bg border border-nora-border rounded px-2 py-1 text-xs text-nora-text"
                        >
                          {WORKSPACES.map((w) => <option key={w}>{w}</option>)}
                        </select>
                      ) : (
                        <span className="text-nora-muted text-xs">{u.workspace}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editing === u.id ? (
                        <input
                          type="checkbox"
                          checked={editData.is_active}
                          onChange={(e) => setEditData((d) => ({ ...d, is_active: e.target.checked }))}
                          className="accent-nora-accent"
                        />
                      ) : (
                        <span className={u.is_active ? 'text-nora-success text-xs' : 'text-nora-error text-xs'}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      {editing === u.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(u.id)} className="text-nora-success hover:text-white"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditing(null)} className="text-nora-error hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(u)} className="text-nora-muted hover:text-nora-text">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
