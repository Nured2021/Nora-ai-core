'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, getMe } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { Zap } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await login(username, password)
      localStorage.setItem('nora_token', access_token)
      const user = await getMe()
      setAuth(user, access_token)
      router.push('/dashboard')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-nora-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-nora-accent mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-nora-text">NORA AI</h1>
          <p className="text-nora-muted text-sm mt-1">Phase 1 — Command Center</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-nora-muted mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-nora-surface border border-nora-border rounded-md px-3 py-2 text-nora-text text-sm outline-none focus:border-nora-accent transition-colors"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-nora-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-nora-surface border border-nora-border rounded-md px-3 py-2 text-nora-text text-sm outline-none focus:border-nora-accent transition-colors"
              placeholder="nora-admin-2024"
              required
            />
          </div>
          {error && <p className="text-nora-error text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-nora-accent hover:bg-nora-accent-hover text-white rounded-md py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-nora-surface border border-nora-border rounded-md">
          <p className="text-xs text-nora-muted mb-2 font-medium">Default credentials:</p>
          <div className="space-y-1 text-xs font-mono">
            <div><span className="text-nora-accent">admin</span> / nora-admin-2024 (ADMIN)</div>
            <div><span className="text-nora-accent">developer</span> / nora-dev-2024 (DEVELOPER)</div>
            <div><span className="text-nora-accent">viewer</span> / nora-view-2024 (VIEWER)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
