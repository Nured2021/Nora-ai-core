'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Activity,
  Hammer,
  Brain,
  UserCheck,
  Users,
  BookMarked,
  Settings,
  LogOut,
  Zap,
  Cpu,
  Database,
  Sparkles,
  Globe,
  Building2,
  FolderOpen,
  Shield,
  BarChart3,
  HeartPulse,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { getGodModeState } from '@/lib/api'

const NAV_ITEMS = [
  { label: 'Dashboard',      href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Live Jobs',      href: '/live-jobs',       icon: Activity },
  { label: 'Builder',        href: '/builder',         icon: Hammer },
  { label: 'Brain Connect',  href: '/brain-connect',   icon: Brain },
  { label: 'HumanLoop',      href: '/humanloop',       icon: UserCheck },
  { label: 'Multi-User',     href: '/multi-user',      icon: Users },
  { label: 'Tactics',        href: '/tactics',         icon: BookMarked },
  { label: 'Settings',       href: '/settings',        icon: Settings },
]

// Phase 5 nav items — grouped separately
const PHASE5_NAV = [
  { label: 'AI CORE',        href: '/ai-core',         icon: Cpu },
  { label: 'Memory View',    href: '/memory-view',     icon: Database },
  { label: 'Personality',    href: '/personality',     icon: Sparkles },
  { label: 'Global Network', href: '/global-network',  icon: Globe },
  { label: 'GOD MODE',       href: '/god-mode',        icon: Zap, special: true },
]

// Phase 6 nav items
const PHASE6_NAV = [
  { label: 'Enterprise',     href: '/enterprise',      icon: Building2 },
  { label: 'Workspaces',     href: '/workspaces',      icon: FolderOpen },
  { label: 'Approvals',      href: '/approvals-center', icon: Shield },
  { label: 'System Health',  href: '/system-health',   icon: HeartPulse },
  { label: 'Analytics',      href: '/analytics',       icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [godModeActive, setGodModeActive] = useState(false)

  // Poll god mode state every 10 seconds to keep indicator updated
  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const state = await getGodModeState()
        if (mounted) setGodModeActive(state.active)
      } catch {}
    }
    check()
    const id = setInterval(check, 10_000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-nora-surface border-r border-nora-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-nora-border">
        <div className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
          godModeActive ? 'bg-purple-600 shadow-md shadow-purple-500/40' : 'bg-nora-accent'
        }`}>
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-nora-text font-bold text-lg tracking-wide">NORA</span>
        <span className="text-xs text-nora-muted ml-auto">v6.0</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {/* Phase 1-4 nav */}
        <div className="space-y-0.5 mb-3">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-nora-accent text-white'
                    : 'text-nora-muted hover:text-nora-text hover:bg-nora-border'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Phase 5 divider */}
        <div className="px-3 py-1 mb-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-nora-border" />
            <span className="text-xs text-nora-muted whitespace-nowrap">Phase 5</span>
            <div className="flex-1 h-px bg-nora-border" />
          </div>
        </div>

        {/* Phase 5 nav */}
        <div className="space-y-0.5">
          {PHASE5_NAV.map(({ label, href, icon: Icon, special }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            const isGodActive = special && godModeActive
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active && isGodActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : active
                    ? 'bg-nora-accent text-white'
                    : isGodActive
                    ? 'text-purple-300 hover:bg-purple-600/20 hover:text-purple-200'
                    : 'text-nora-muted hover:text-nora-text hover:bg-nora-border'
                )}
              >
                <Icon className={clsx('w-4 h-4 shrink-0', isGodActive && 'animate-pulse')} />
                <span className="flex-1">{label}</span>
                {isGodActive && (
                  <span className="text-xs bg-purple-600 text-white px-1 rounded font-bold">ON</span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Phase 6 divider */}
        <div className="px-3 py-1 mb-1 mt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-nora-border" />
            <span className="text-xs text-nora-muted whitespace-nowrap">Phase 6</span>
            <div className="flex-1 h-px bg-nora-border" />
          </div>
        </div>

        {/* Phase 6 nav */}
        <div className="space-y-0.5">
          {PHASE6_NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-nora-accent text-white'
                    : 'text-nora-muted hover:text-nora-text hover:bg-nora-border'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="px-4 py-4 border-t border-nora-border">
          <div className="text-xs text-nora-muted mb-1">{user.workspace}</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-nora-text font-medium">{user.username}</div>
              <div className={`text-xs ${godModeActive ? 'text-purple-400' : 'text-nora-accent'}`}>
                {user.role}{godModeActive ? ' ⚡' : ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-nora-muted hover:text-nora-error transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
